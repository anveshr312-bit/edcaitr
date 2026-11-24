'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

export default function Account() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'auth' | 'forgot_password'>('auth');
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage('Account services are not configured yet.');
      return;
    }

    // Check if error parameter exists in URL (e.g. from callback failure)
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    if (authError === 'auth_callback_failed') {
      setMessage('Authentication session exchange failed or expired. Please sign in again.');
    }

    // Initialize session and restore state
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // If expired or session missing, ensure state is cleared cleanly
        setUserEmail(null);
      } else {
        setUserEmail(data.user?.email ?? null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setPassword('');
      } else if (event === 'TOKEN_REFRESHED') {
        // Session successfully refreshed
      } else if (event === 'PASSWORD_RECOVERY') {
        // Redirect or allow user to reset password
        window.location.href = '/account/reset-password';
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function act(action: 'login' | 'signup' | 'google' | 'logout' | 'forgot_password') {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback`;

      if (action === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
          },
        });
        if (error) throw error;
      } else if (action === 'logout') {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setMessage('Signed out.');
      } else if (action === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        });
        if (error) throw error;
        setMessage(
          'Check your email for confirmation. Creating an account does not grant administrative access.'
        );
        setPassword('');
      } else if (action === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
        });
        if (error) throw error;
        setRecoverySent(true);
        setMessage('Password reset instructions sent. Please check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword('');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Account request failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (view === 'forgot_password') {
      void act('forgot_password');
    } else {
      void act('login');
    }
  }

  return (
    <>
      <h1>Participant account</h1>
      {userEmail ? (
        <section>
          <p>Signed in as {userEmail}</p>
          <p>
            <Link href="/account/dashboard">Open Account Dashboard →</Link>
          </p>
          <button disabled={busy} onClick={() => void act('logout')}>
            {busy ? 'Signing out...' : 'Sign out'}
          </button>
        </section>
      ) : view === 'forgot_password' ? (
        <>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button disabled={!supabase || busy || !email}>
              {busy ? 'Sending...' : 'Send reset instructions'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setView('auth');
                setMessage('');
                setRecoverySent(false);
              }}
            >
              Back to Sign in
            </button>
          </form>
          {recoverySent && (
            <p>
              Check your inbox for the reset link, or{' '}
              <Link href="/account/reset-password">click here</Link> if you already have a reset link.
            </p>
          )}
        </>
      ) : (
        <>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button disabled={!supabase || busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              type="button"
              disabled={!supabase || busy || !email || password.length < 8}
              onClick={() => void act('signup')}
            >
              Create account
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setView('forgot_password');
                setMessage('');
              }}
            >
              Forgot password?
            </button>
          </form>
          <section>
            <button disabled={!supabase || busy} onClick={() => void act('google')}>
              Continue with Google
            </button>
          </section>
        </>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
