'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

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

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setUserEmail(null);
        setCheckingSession(false);
      } else {
        setUserEmail(data.user.email ?? null);
        // Automatically route logged-in users to the full Account Dashboard
        router.replace('/account/dashboard');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentEmail = session?.user?.email ?? null;
      setUserEmail(currentEmail);
      if (event === 'SIGNED_IN' && session?.user) {
        router.replace('/account/dashboard');
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setPassword('');
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
      const callbackUrl = `${origin}/auth/callback?next=/account/dashboard`;

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword('');
        router.replace('/account/dashboard');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed. Please retry.');
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

  if (checkingSession && userEmail) {
    return (
      <div style={{ maxWidth: 460, margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edc-logo-light.png"
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
      <div className="card" style={{ padding: '32px 28px', boxShadow: '0 8px 30px rgba(17,19,24,0.06)' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/edc-logo-light.png"
            alt="EDC AITR Logo"
            style={{ height: 42, width: 'auto', margin: '0 auto 12px', display: 'block' }}
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px', color: '#111318' }}>
            EDC AITR Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#686D7A', margin: 0 }}>
            Entrepreneurship Development Cell · AITR
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        {mode !== 'forgot_password' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: '#f0ece2', padding: 4, borderRadius: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(''); }}
              style={{
                background: mode === 'signin' ? '#ffffff' : 'transparent',
                color: mode === 'signin' ? '#111318' : '#686D7A',
                fontWeight: mode === 'signin' ? 600 : 500,
                boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                border: 'none',
                borderRadius: 6,
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
                background: mode === 'signup' ? '#ffffff' : 'transparent',
                color: mode === 'signup' ? '#111318' : '#686D7A',
                fontWeight: mode === 'signup' ? 600 : 500,
                boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                border: 'none',
                borderRadius: 6,
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
                    style={{ background: 'none', border: 'none', color: '#E04826', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
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
            Received your reset link? <Link href="/account/reset-password">Click here to enter new password</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
