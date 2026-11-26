import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, FileCheck2, ShieldCheck, Users } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';
import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (role !== 'advisor' && role !== 'director') redirect('/account/dashboard');

  const isDirector = role === 'director';
  const allowedTypes = isDirector
    ? ['advisor_application', 'core_team_application', 'alumni_verification', 'promotion_nomination']
    : ['core_team_application', 'alumni_verification'];

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, application_type, status, statement, created_at,
      applicant_id,
      profiles!applicant_id (full_name, college, designation)
    `)
    .in('application_type', allowedTypes)
    .eq('status', 'pending')
    .is('reviewed_at', null)
    .order('created_at', { ascending: true });

  const normalized = (applications ?? []).map((app) => ({
    id: String(app.id),
    application_type: String(app.application_type),
    status: String(app.status),
    statement: app.statement ? String(app.statement) : null,
    created_at: String(app.created_at),
    applicant_id: String(app.applicant_id),
    profiles: Array.isArray(app.profiles)
      ? (app.profiles[0] ?? null)
      : (app.profiles ?? null),
  }));

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
        <span className="font-semibold text-[var(--color-2-mood)]">Applications Queue</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <FileCheck2 className="h-3.5 w-3.5" />
          <span>{isDirector ? 'Director Governance Review' : 'Advisor Governance Review'}</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Pending Candidate Applications
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {isDirector
            ? 'Review and decide on candidate applications across every governance level, including advisor nominations and executive promotions.'
            : 'Evaluate student candidate statements for Core Team membership and Alumni Connect verification.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-[#C01E30] dark:text-[#E67C87]">
            {normalized.length}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Queue
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-[var(--color-2-mood)]">
            {normalized.filter((a) => a.application_type === 'core_team_application').length}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Core Team
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-[var(--color-2-mood)]">
            {normalized.filter((a) => a.application_type === 'alumni_verification').length}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Alumni
          </div>
        </div>

        {isDirector && (
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
            <div className="font-display text-3xl font-extrabold text-purple-600 dark:text-purple-400">
              {normalized.filter((a) => a.application_type === 'advisor_application').length}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Advisor
            </div>
          </div>
        )}
      </div>

      {/* Applications list */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C01E30]/10 text-[#C01E30]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Awaiting Governance Decision
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {normalized.length === 0
                  ? 'All applications have been reviewed'
                  : `${normalized.length} pending candidate review`}
              </p>
            </div>
          </div>
        </div>

        <ApplicationsClient applications={normalized} />
      </div>
    </div>
  );
}
