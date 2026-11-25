import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '../../lib/supabase/server';
import { getUserRole } from '../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function AlumniConnectLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['director', 'advisor', 'core_team', 'alumni'].includes(role)) {
    redirect('/account/dashboard');
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <span className="stamp-label">
            <span className="stamp-dot" />
            Private EDC AITR Network
          </span>
          <h1 style={{ marginTop: 8, marginBottom: 0 }}>Alumni Connect</h1>
        </div>
        <Link href="/account/dashboard">← Account Dashboard</Link>
      </div>

      <nav
        aria-label="Alumni Connect sections"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          paddingBottom: 16,
          marginBottom: 28,
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        <Link href="/alumni/directory" className="btn">Directory</Link>
        <Link href="/alumni/startups" className="btn">Startups</Link>
        <Link href="/alumni/opportunities" className="btn">Opportunities</Link>
        <Link href="/alumni/messages" className="btn">Messages</Link>
      </nav>

      {children}
    </>
  );
}
