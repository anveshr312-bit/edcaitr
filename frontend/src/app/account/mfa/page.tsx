'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Step = 'check' | 'enroll' | 'verify' | 'done' | 'already_enrolled';

export default function MfaPage() {
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<Step>('check');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [totp, setTotp] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.currentLevel === 'aal2') {
        setStep('done');
        setMessage('MFA is already verified for this session.');
      } else if (data?.nextLevel === 'aal2') {
        setStep('verify');
        startChallenge();
      } else {
        setStep('enroll');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function startEnroll() {
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'EDC AITR',
        friendlyName: 'Director TOTP',
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('verify');
      await startChallenge(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Enrollment failed.');
    } finally {
      setBusy(false);
    }
  }

  async function startChallenge(fid?: string) {
    if (!supabase) return;
    try {
      let id = fid ?? factorId;
      if (!id) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.[0];
        if (!totpFactor) return;
        id = totpFactor.id;
        setFactorId(id);
      }
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: id });
      if (error) throw error;
      setChallengeId(data.id);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Challenge failed.');
    }
  }

  async function verify() {
    if (!supabase || !factorId || !challengeId || totp.length !== 6) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: totp });
      if (error) throw error;
      setStep('done');
      setMessage('MFA verified. Director-gated actions are now available for this session.');
      setTotp('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Verification failed. Check the code and try again.');
      setTotp('');
      await startChallenge();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Director Security
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Authenticator MFA
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>
          Director-gated administrative actions require two-factor authentication via a TOTP authenticator app.
        </p>
      </div>

      {step === 'check' && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Checking MFA status…
        </div>
      )}

      {step === 'enroll' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Set up your authenticator</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app,
            then click the button below to get your setup QR code.
          </p>
          <button className="btn btn-primary" onClick={startEnroll} disabled={busy}>
            {busy ? 'Generating…' : 'Set up authenticator app'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div style={{ display: 'grid', gap: 24 }}>
          {qrCode && (
            <div className="card" style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', border: '1px solid rgba(224,72,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>1</div>
                <strong>Scan this QR code with your authenticator app</strong>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="TOTP QR code" width={180} height={180} style={{ display: 'block', margin: '0 0 16px', border: '2px solid var(--border-hairline)', borderRadius: 8, padding: 8, background: '#fff' }} />
              <div style={{ padding: '10px 14px', background: 'var(--surface-subtle)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                Can&apos;t scan? Enter this key manually:
                <code style={{ display: 'block', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-hairline)', padding: '6px 10px', borderRadius: 'var(--radius-control)', letterSpacing: '0.04em', wordBreak: 'break-all' }}>{secret}</code>
              </div>
            </div>
          )}

          <div className="card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-tint)', color: 'var(--color-3-accent-personality)', border: '1px solid rgba(224,72,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{qrCode ? '2' : '1'}</div>
              <strong>Enter the 6-digit code from your app</strong>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totp}
                onChange={e => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', width: 160, padding: '10px 14px', border: '2px solid var(--border-hairline)', borderRadius: 6 }}
              />
              <button className="btn btn-primary" onClick={verify} disabled={busy || totp.length !== 6} style={{ marginTop: 4 }}>
                {busy ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card" style={{ maxWidth: 480, borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <strong style={{ color: 'var(--success)' }}>MFA Active</strong>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
        </div>
      )}

      {message && step !== 'done' && (
        <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--danger)', fontWeight: 500 }}>
          {message}
        </p>
      )}

      <p>
        <a href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </p>
    </div>
  );
}
