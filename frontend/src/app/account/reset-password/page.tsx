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

    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setIsSuccess(true);
      setMessage('Password has been successfully updated. You can now access your account.');
      setPassword(''); setConfirmPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '40px 36px' }}>
        {/* Lock icon */}
        <div style={{ width: 48, height: 48, background: 'var(--color-2-mood)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-1-mood)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700 }}>Reset Password</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Enter and confirm your new password below.
        </p>

        {isSuccess ? (
          <div>
            <div style={{ padding: '16px', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>{message}</p>
              </div>
            </div>
            <Link href="/account" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              Return to Account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>New Password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Confirm New Password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>Passwords do not match</span>
              )}
            </label>
            {message && !isSuccess && (
              <p role="status" style={{ margin: 0, color: 'var(--danger)', fontSize: 14 }}>{message}</p>
            )}
            <button type="submit" className="btn btn-primary" disabled={!supabase || busy || password.length < 8} style={{ marginTop: 4 }}>
              {busy ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
