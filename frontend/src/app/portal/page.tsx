import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Layers,
  MapPin,
  QrCode,
  Ticket,
} from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { getPublicEvents } from '../../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function ParticipantPortalPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const [{ data: registrations }, { data: announcements }, events] = await Promise.all([
    supabase
      .from('registrations')
      .select('id, status, payment_status, events(title, slug, starts_at, venue)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    getPublicEvents(false),
  ]);

  const confirmedRegs = (registrations ?? []).filter((r) => r.status === 'confirmed').length;

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
        <span className="font-semibold text-[var(--color-2-mood)]">Participant Portal</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Layers className="h-3.5 w-3.5" />
          <span>Participant Portal</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Event Pass &amp; Credentials Hub
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Manage your verified event admissions, download QR tickets, access blockchain-audited certificates, and view live summit broadcasts.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/portal/registrations"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625]"
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>Your Registrations</span>
          </Link>
          <Link
            href="/portal/certificates"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-5 text-xs font-semibold text-[var(--color-2-mood)] shadow-xs transition-all hover:bg-[var(--surface)] hover:border-[#C01E30]/40"
          >
            <Award className="h-3.5 w-3.5" />
            <span>Certificates</span>
          </Link>
          <Link
            href="/portal/announcements"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-5 text-xs font-semibold text-[var(--color-2-mood)] shadow-xs transition-all hover:bg-[var(--surface)] hover:border-[#C01E30]/40"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Announcements</span>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-[#C01E30] dark:text-[#E67C87]">
            {(registrations ?? []).length}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Total Registrations
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {confirmedRegs}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Confirmed Passes
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5 text-center shadow-xs">
          <div className="font-display text-3xl font-extrabold text-[var(--color-2-mood)]">
            {(announcements ?? []).length}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Broadcasts Posted
          </div>
        </div>
      </div>

      {/* Recent registrations */}
      <section className="mb-10 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <Ticket className="h-4 w-4 text-[#C01E30]" />
            <h2 className="text-base font-bold text-[var(--color-2-mood)]">
              Recent Event Registrations
            </h2>
          </div>
          <Link
            href="/portal/registrations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C01E30] hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {!registrations || registrations.length === 0 ? (
          <div className="py-10 text-center">
            <Ticket className="mx-auto h-10 w-10 text-[var(--text-muted)] opacity-60" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No event registrations found.</p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C01E30] hover:underline"
            >
              <span>Explore upcoming summits &amp; workshops</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {registrations.map((reg) => {
              const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
              const isConfirmed = reg.status === 'confirmed';

              return (
                <div
                  key={reg.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 transition-all hover:border-[var(--border-strong)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          isConfirmed
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isConfirmed && <CheckCircle2 className="h-3 w-3" />}
                        <span>{reg.status.replace('_', ' ')}</span>
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] capitalize">
                        {reg.payment_status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-[var(--color-2-mood)]">
                      {ev?.title ?? 'EDC Event'}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                      {ev?.starts_at && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                          <span>{new Date(ev.starts_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                        </div>
                      )}
                      {ev?.venue && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-[var(--text-muted)]" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[var(--border-hairline)] pt-3">
                    <Link
                      href={`/portal/registrations/${reg.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#C01E30] hover:underline"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Open Admission Pass &amp; QR →</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Announcements Section */}
      {announcements && announcements.length > 0 && (
        <section className="mb-10 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-[#C01E30]" />
              <h2 className="text-base font-bold text-[var(--color-2-mood)]">
                Latest Announcements
              </h2>
            </div>
            <Link
              href="/portal/announcements"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C01E30] hover:underline"
            >
              <span>All updates</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--color-2-mood)]">{a.title}</h3>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explore upcoming events */}
      {events.length > 0 && (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
            <h2 className="text-base font-bold text-[var(--color-2-mood)]">
              Upcoming Flagship Initiatives
            </h2>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[#C01E30]"
            >
              <span>View all events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {events.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5"
              >
                <div>
                  <span className="inline-flex items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[var(--color-2-mood)]">
                    {ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free Access'}
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-[var(--color-2-mood)]">{ev.title}</h3>
                  {ev.summary && (
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-2">
                      {ev.summary}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-hairline)]">
                  <Link
                    href={`/events/${ev.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#C01E30] hover:underline"
                  >
                    <span>Register now →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
