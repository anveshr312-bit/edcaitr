import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';
import TeamAdminClient from './TeamAdminClient';

export default async function TeamAdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (role !== 'advisor' && role !== 'director') redirect('/account/dashboard');

  const { data: memberships } = await supabase
    .from('org_memberships')
    .select(`
      id, user_id, role, status, effective_from,
      profiles!user_id (full_name, designation, college)
    `)
    .eq('status', 'approved')
    .is('effective_until', null)
    .order('role', { ascending: true });

  const normalized = (memberships ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles ?? null);
    return {
      id: String(m.id),
      user_id: String(m.user_id),
      role: String(m.role),
      effective_from: m.effective_from ? String(m.effective_from) : null,
      full_name: profile?.full_name ? String(profile.full_name) : 'Unnamed Member',
      designation: profile?.designation ? String(profile.designation) : null,
    };
  });

  const isDirector = role === 'director';

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/account/dashboard"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Team &amp; Tenure</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{isDirector ? 'Director Governance' : 'Advisor Governance'}</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Team &amp; Tenure Management
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {isDirector
            ? 'Nominate promotions, oversee active tenures, or record departures and suspensions with MFA verification.'
            : 'Review active cell memberships and nominate high-performing Core Team members for promotion to Advisor.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(['director', 'advisor', 'core_team'] as const).map((r) => {
          const count = normalized.filter((m) => m.role === r).length;
          const roleLabel = r === 'core_team' ? 'Core Team' : r.charAt(0).toUpperCase() + r.slice(1);
          return (
            <div
              key={r}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs"
            >
              <div className="font-display text-3xl font-extrabold text-[#C01E30] dark:text-[#E67C87]">
                {count}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {roleLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Members Section */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C01E30]/10 text-[#C01E30]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Active Organization Roster
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {normalized.length} active verified members
              </p>
            </div>
          </div>
        </div>

        <TeamAdminClient
          members={normalized}
          currentUserId={user.id}
          isDirector={isDirector}
        />
      </div>
    </div>
  );
}
