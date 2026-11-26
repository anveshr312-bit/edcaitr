import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CalendarPlus, Sparkles } from 'lucide-react';
import { createClient } from '../../../../lib/supabase/server';
import { getUserRole } from '../../../../lib/auth/authorization';
import NewEventClient from './NewEventClient';

export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
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

  const { data: candidates } = await supabase.rpc('get_approved_spoc_candidates');

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/workspace/events"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Events Workspace</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">New Event</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <CalendarPlus className="h-3.5 w-3.5" />
          <span>Event Publishing</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Create New Event
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Configure event details, ticket fees, capacity ceilings, and assign verified single-point contacts (SPOCs).
        </p>
      </div>

      {/* New Event Form Component */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <NewEventClient
          candidates={
            (candidates as {
              id: string;
              full_name: string;
              designation: string | null;
              role: string;
            }[]) ?? []
          }
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
