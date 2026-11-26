'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export function SignOutButton({
  className = 'btn',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // Hard redirect to clear client state and cookies
      window.location.href = '/account';
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
      style={{
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        cursor: loading ? 'wait' : 'pointer',
        ...style,
      }}
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
