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

  // On load: check current MFA assurance level
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.currentLevel === 'aal2') {
        setStep('done');
        setMessage('MFA is already verified for this session.');
      } else if (data?.nextLevel === 'aal2') {
        // Enrolled but not verified this session
        setStep('verify');
        // Start a challenge immediately
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
        issuer: 'E-Cell AITR',
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
      // Find existing enrolled factor if not passed
      let id = fid ?? factorId;
      if (!id) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];
        if (!totp) return;
        id = totp.id;
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
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: totp,
      });
      if (error) throw error;
      setStep('done');
      setMessage('MFA verified. Director-gated actions are now available for this session.');
      setTotp('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Verification failed. Check the code and try again.');
      setTotp('');
      // Refresh challenge
      await startChallenge();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Authenticator MFA</h1>

      {step === 'enroll' && (
        <>
          <p>
            Director-gated actions require an authenticator app (TOTP).
            Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app,
            then click the button below to get your setup QR code.
          </p>
          <button onClick={startEnroll} disabled={busy}>
            {busy ? 'Generating…' : 'Set up authenticator app'}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          {qrCode && (
            <>
              <p><strong>Step 1:</strong> Scan this QR code with your authenticator app.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="TOTP QR code" width={200} height={200} style={{ display: 'block', margin: '16px 0', border: '1px solid #ccd2da' }} />
              <p style={{ fontSize: 13, color: '#555' }}>
                Can&apos;t scan? Enter this key manually: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>{secret}</code>
              </p>
              <hr style={{ margin: '20px 0' }} />
              <p><strong>Step 2:</strong> Enter the 6-digit code from your app to confirm setup.</p>
            </>
          )}

          {!qrCode && (
            <p>Enter the 6-digit code from your authenticator app to verify this session.</p>
          )}

          <label>
            6-digit code
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totp}
              onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              placeholder="000000"
              style={{ letterSpacing: 6, fontSize: 20, maxWidth: 160 }}
            />
          </label>
          <button onClick={verify} disabled={busy || totp.length !== 6}>
            {busy ? 'Verifying…' : (qrCode ? 'Confirm & enable MFA' : 'Verify')}
          </button>
        </>
      )}

      {step === 'done' && (
        <p style={{ color: '#2e7d32' }}>
          ✓ MFA is active and verified for this session. Director-gated actions are available.
        </p>
      )}

      {message && (
        <p role="status" aria-live="polite" style={{ color: step === 'done' ? '#2e7d32' : '#c62828', marginTop: 12 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/account/dashboard">← Back to dashboard</a>
      </p>
    </>
  );
}
