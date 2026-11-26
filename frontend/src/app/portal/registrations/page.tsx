import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  QrCode,
  Ticket,
  XCircle,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RegistrationsListPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id, status, payment_status, participant_category, created_at,
      events(title, slug, starts_at, venue),
      tickets(ticket_code),
      attendance_logs(checked_in_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const statusConfig: Record<string, { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }> = {
    confirmed: {
      label: 'Confirmed',
      badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pending Review',
      badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      icon: Clock,
    },
    cancelled: {
      label: 'Cancelled',
      badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      icon: XCircle,
    },
    waitlisted: {
      label: 'Waitlisted',
      badgeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600',
      icon: Clock,
    },
  };

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
        <span className="font-semibold text-[var(--color-2-mood)]">Registrations</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Ticket className="h-3.5 w-3.5" />
          <span>Passes &amp; Admissions</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Your Event Registrations
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Manage your confirmed admission passes, download personal QR tickets for venue entry, and track check-in logs.
        </p>
      </div>

      {/* Stats summary row */}
      {registrations && registrations.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {(['confirmed', 'pending', 'cancelled'] as const).map((s) => {
            const count = (registrations ?? []).filter((r) => r.status === s).length;
            const config = statusConfig[s];
            return (
              <div
                key={s}
                className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs"
              >
                <div
                  className={`font-display text-3xl font-extrabold ${
                    s === 'confirmed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : s === 'pending'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {count}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {config?.label ?? s}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registrations List */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        {!registrations || registrations.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No event registrations found
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              You haven&apos;t registered for any upcoming events yet.
            </p>
            <div className="mt-6">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625]"
              >
                <span>Browse upcoming events</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {registrations.map((reg) => {
              const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
              const ticket = Array.isArray(reg.tickets) ? reg.tickets[0] : reg.tickets;
              const att = Array.isArray(reg.attendance_logs) ? reg.attendance_logs[0] : reg.attendance_logs;
              const config = statusConfig[reg.status] ?? statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <article
                  key={reg.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-6 transition-all hover:border-[var(--border-strong)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${config.badgeClass}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{config.label}</span>
                      </span>

                      <span className="text-[11px] text-[var(--text-muted)]">
                        {att ? '✓ Checked in' : 'Not checked in'}
                      </span>
                    </div>

                    <h2 className="mt-4 text-base font-bold text-[var(--color-2-mood)]">
                      {ev?.title ?? 'EDC Event'}
                    </h2>

                    {ticket?.ticket_code && (
                      <div className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
                        <span>Pass Code:</span>
                        <span>{ticket.ticket_code}</span>
                      </div>
                    )}

                    <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                      {ev?.starts_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          <span>{new Date(ev.starts_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        </div>
                      )}
                      {ev?.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[var(--border-hairline)] pt-4">
                    <Link
                      href={`/portal/registrations/${reg.id}`}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625]"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>{ticket ? 'View QR Ticket Pass' : 'View Registration Status'}</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
