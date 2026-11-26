import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell, Calendar, Sparkles } from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, events(title)')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Portal</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Announcements</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Bell className="h-3.5 w-3.5" />
          <span>Live Broadcasts</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Official Announcements
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Real-time updates, schedule revisions, venue changes, and important summit broadcasts from the EDC organizing committee.
        </p>
      </div>

      {/* Announcements List */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        {!announcements || announcements.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No announcements posted yet
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Check back closer to event dates for live logistical notices and agenda briefings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => {
              const ev = Array.isArray(a.events) ? a.events[0] : a.events;
              return (
                <article
                  key={a.id}
                  className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 sm:p-6 transition-all hover:border-[var(--border-strong)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {ev?.title && (
                        <span className="rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#C01E30] dark:text-[#E67C87]">
                          {ev.title}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                        {a.title}
                      </h2>
                    </div>

                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                    {a.body}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
