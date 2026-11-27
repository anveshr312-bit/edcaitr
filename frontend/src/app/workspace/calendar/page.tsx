import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { createAdminClient, getUserRole } from '../../../lib/auth/authorization';
import EventCalendar from '../../../components/workspace/EventCalendar';

export const dynamic = 'force-dynamic';

export default async function WorkspaceCalendarPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  // Mandatory Director MFA check
  if (role === 'director') {
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (mfaData?.currentLevel !== 'aal2') {
      redirect('/account/mfa?required=1');
    }
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('domain')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-12 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Workspace</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Master Calendar &amp; Pipeline</span>
      </div>

      {/* Calendar Component */}
      <EventCalendar userRole={role} userDomain={profile?.domain ?? null} />
    </div>
  );
}
