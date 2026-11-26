'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { returnPath } from '../../lib/auth/returnPath';

function destination() {
  if (typeof window === 'undefined') return '/account/dashboard';
  return returnPath(new URLSearchParams(window.location.search).get('next'));
}

export default function Account() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  const [recoverySent, setRecoverySent] = useState(false);

  // Director MFA mandatory verification state
  const [isDirectorMfa, setIsDirectorMfa] = useState(false);
  const [mfaStep, setMfaStep] = useState<'verify' | 'enroll'>('verify');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');

  async function setupOrChallengeMfa() {
    if (!supabase) return;
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setMfaStep('verify');
        const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (!chErr && ch) {
          setChallengeId(ch.id);
        }
      } else {
        const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'EDC AITR',
          friendlyName: 'Director Authenticator',
        });
        if (enrollErr) throw enrollErr;
        setFactorId(enrollData.id);
        setQrCode(enrollData.totp.qr_code);
        setSecret(enrollData.totp.secret);
        setMfaStep('enroll');
        const { data: ch } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
        if (ch) setChallengeId(ch.id);
      }
    } catch (err: unknown) {
      console.warn('MFA initialization error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to initialize Director MFA challenge.');
    }
  }

  useEffect(() => {
    if (!supabase) {
      setMessage('Account services are not configured yet.');
      setCheckingSession(false);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    if (authError === 'auth_callback_failed') {
      setMessage('Authentication session expired or failed. Please sign in again.');
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        setUserEmail(null);
        setCheckingSession(false);
      } else {
        setUserEmail(data.user.email ?? null);
        try {
          const { data: role } = await supabase.rpc('get_user_role', { user_uuid: data.user.id });
          if (role === 'director') {
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfaData?.currentLevel !== 'aal2') {
              setIsDirectorMfa(true);
              setCheckingSession(false);
              await setupOrChallengeMfa();
              return;
            }
          }
        } catch {
          // Fallback if RPC fails
        }
        router.replace(destination());
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentEmail = session?.user?.email ?? null;
      setUserEmail(currentEmail);
      if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setPassword('');
        setIsDirectorMfa(false);
        setCheckingSession(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/account/reset-password';
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  async function act(action: 'login' | 'signup' | 'google' | 'logout' | 'forgot_password') {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(destination())}`;

      if (action === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: callbackUrl },
        });
        if (error) throw error;
      } else if (action === 'logout') {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUserEmail(null);
        setIsDirectorMfa(false);
        setMessage('Signed out successfully.');
      } else if (action === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        setMessage('Confirmation email sent! Please check your inbox to verify your account.');
        setPassword('');
      } else if (action === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
        });
        if (error) throw error;
        setRecoverySent(true);
        setMessage('Password reset link sent to your email.');
      } else {
        const { data: signData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword('');

        const userId = signData.user?.id;
        if (userId) {
          const { data: role } = await supabase.rpc('get_user_role', { user_uuid: userId });
          if (role === 'director') {
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfaData?.currentLevel !== 'aal2') {
              setIsDirectorMfa(true);
              await setupOrChallengeMfa();
              return;
            }
          }
        }
        router.replace(destination());
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  async function submitDirectorMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || totpCode.length !== 6 || !factorId) return;
    setBusy(true);
    setMessage('');
    try {
      let cid = challengeId;
      if (!cid) {
        const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
        if (chErr) throw chErr;
        cid = chData.id;
        setChallengeId(cid);
      }
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: cid, code: totpCode });
      if (error) throw error;
      setMessage('Authenticator code verified! Redirecting to Dashboard...');
      router.replace(destination());
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Invalid authenticator code. Please check your app and try again.');
      setTotpCode('');
      try {
        const { data: newCh } = await supabase.auth.mfa.challenge({ factorId });
        if (newCh) setChallengeId(newCh.id);
      } catch {}
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'forgot_password') {
      void act('forgot_password');
    } else if (mode === 'signup') {
      void act('signup');
    } else {
      void act('login');
    }
  }

  // Mandatory Director MFA Screen
  if (isDirectorMfa) {
    return (
      <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
        <div
          className="card"
          style={{
            padding: '36px 30px',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-panel)',
            background: 'var(--surface)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 999,
                background: 'rgba(192,30,48,0.1)',
                color: '#C01E30',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              <ShieldCheck style={{ width: 15, height: 15 }} />
              <span>Director Security Verification</span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-2-mood)' }}>
              Write the Authenticator Code
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
              Your account holds the <strong>Director</strong> governance role. Enter the 6-digit TOTP code from your authenticator app to authorize this session.
            </p>
          </div>

          {mfaStep === 'enroll' && qrCode && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: 20,
                padding: 16,
                background: 'var(--surface-subtle)',
                borderRadius: 12,
                border: '1px solid var(--border-hairline)',
              }}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-2-mood)', marginBottom: 10 }}>
                Scan this QR code in Google Authenticator or Microsoft Authenticator:
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="TOTP QR Code"
                style={{ width: 160, height: 160, margin: '0 auto', borderRadius: 8, display: 'block' }}
              />
              {secret && (
                <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: 8 }}>
                  Manual key: <strong>{secret}</strong>
                </p>
              )}
            </div>
          )}

          <form onSubmit={submitDirectorMfa} style={{ display: 'grid', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-2-mood)', marginBottom: 8, textAlign: 'center' }}>
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                required
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '14px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border-strong)',
                  fontSize: '1.75rem',
                  textAlign: 'center',
                  letterSpacing: '0.35em',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                  background: 'var(--surface-subtle)',
                  color: 'var(--color-2-mood)',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                Open Google Authenticator, Microsoft Authenticator, or 1Password to view your current code.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy || totpCode.length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {busy ? (
                <>
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                'Verify & Enter Dashboard →'
              )}
            </button>
          </form>

          {message && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 18,
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                background: message.includes('failed') || message.includes('error') || message.includes('Invalid') ? '#FEF2F2' : '#F0FDF4',
                color: message.includes('failed') || message.includes('error') || message.includes('Invalid') ? '#991B1B' : '#166534',
                border: `1px solid ${message.includes('failed') || message.includes('error') || message.includes('Invalid') ? '#FECACA' : '#BBF7D0'}`,
                textAlign: 'center',
              }}
            >
              {message}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: 16 }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void act('logout')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              ← Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checkingSession && userEmail) {
    return (
      <div style={{ maxWidth: 460, margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edc-logo-light.webp"
            alt="EDC AITR"
            style={{ height: 44, width: 'auto', margin: '0 auto', display: 'block' }}
          />
        </div>
        <p style={{ color: '#686D7A', fontSize: '0.95rem' }}>
          Signing you into your account dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 440, margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '32px 28px', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', background: 'var(--surface)' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edc-logo-light.webp"
            alt="EDC AITR Logo"
            style={{ height: 40, width: 'auto', margin: '0 auto 12px', display: 'block' }}
          />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            EDC AITR Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Entrepreneurship Development Cell · AITR
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        {mode !== 'forgot_password' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--surface-subtle)', padding: 4, borderRadius: 'var(--radius-control)', marginBottom: 20, border: '1px solid var(--border-hairline)' }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(''); }}
              style={{
                background: mode === 'signin' ? 'var(--surface)' : 'transparent',
                color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: mode === 'signin' ? 600 : 500,
                border: mode === 'signin' ? '1px solid var(--border-hairline)' : '1px solid transparent',
                borderRadius: 'var(--radius-control)',
                padding: '8px 12px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setMessage(''); }}
              style={{
                background: mode === 'signup' ? 'var(--surface)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: mode === 'signup' ? 600 : 500,
                border: mode === 'signup' ? '1px solid var(--border-hairline)' : '1px solid transparent',
                borderRadius: 'var(--radius-control)',
                padding: '8px 12px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Google OAuth Button */}
        {mode !== 'forgot_password' && (
          <>
            <button
              type="button"
              disabled={!supabase || busy}
              onClick={() => void act('google')}
              className="btn"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#ffffff',
                border: '1px solid #D6D0C4',
                color: '#111318',
                fontWeight: 600,
                padding: '10px 16px',
                marginBottom: 16,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E2DDD4' }} />
              <span style={{ fontSize: '0.75rem', color: '#8C92A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                or with email
              </span>
              <div style={{ flex: 1, height: 1, background: '#E2DDD4' }} />
            </div>
          </>
        )}

        {/* Email / Password Form */}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#3F4451', marginBottom: 6 }}>
              College or Personal Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@acropolis.in or personal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #D6D0C4',
                fontSize: '0.9375rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mode !== 'forgot_password' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3F4451' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); setMessage(''); }}
                    style={{ background: 'none', border: 'none', color: '#C01E30', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={8}
                placeholder="Min 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #D6D0C4',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!supabase || busy}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, marginTop: 4 }}
          >
            {busy
              ? 'Processing...'
              : mode === 'signin'
                ? 'Sign In to Portal'
                : mode === 'signup'
                  ? 'Create EDC Account'
                  : 'Send Reset Instructions'}
          </button>

          {mode === 'forgot_password' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => { setMode('signin'); setMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#686D7A', fontSize: '0.85rem', cursor: 'pointer', marginTop: 4 }}
            >
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* Status / Error Message */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              background: message.includes('failed') || message.includes('error') ? '#FEF2F2' : '#F0FDF4',
              color: message.includes('failed') || message.includes('error') ? '#991B1B' : '#166534',
              border: `1px solid ${message.includes('failed') || message.includes('error') ? '#FECACA' : '#BBF7D0'}`,
            }}
          >
            {message}
          </div>
        )}

        {recoverySent && mode === 'forgot_password' && (
          <p style={{ fontSize: '0.8125rem', color: '#686D7A', marginTop: 12, textAlign: 'center' }}>
            Please open the link sent to your email to verify your identity and set a new password.
          </p>
        )}
      </div>
    </div>
  );
}
