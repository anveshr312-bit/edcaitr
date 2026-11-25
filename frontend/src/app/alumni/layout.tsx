import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { createClient } from '../../lib/supabase/server';
import { getUserRole } from '../../lib/auth/authorization';
import { createPrivateMetadata } from '../../lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPrivateMetadata('Alumni Connect');

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
      <div style={{ marginBottom: 20 }}>
        <Link href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Account Dashboard
        </Link>
      </div>

      {children}
    </>
  );
}
