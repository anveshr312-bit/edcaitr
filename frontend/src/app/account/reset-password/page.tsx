'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage('Account services are not configured yet.');
    }
  }, [supabase]);

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      setMessage('Password has been successfully updated. You can now access your account.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Reset Password</h1>
      {isSuccess ? (
        <section>
          <p>{message}</p>
          <Link href="/account">Return to Account</Link>
        </section>
      ) : (
        <form onSubmit={handleReset}>
          <label>
            New Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={!supabase || busy || password.length < 8}>
            {busy ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
