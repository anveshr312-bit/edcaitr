import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  QrCode,
  Ticket,
  User,
  XCircle,
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase/server';
import { generateQrDataUrl } from '../../../../lib/tickets/email';
import TicketPrinterClient from './TicketPrinterClient';

export const dynamic = 'force-dynamic';

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const [{ data: reg }, { data: profile }] = await Promise.all([
    supabase
      .from('registrations')
      .select(`
        id, status, payment_status, payment_ref, participant_category,
        events(title, slug, venue, starts_at),
        tickets(ticket_code, qr_token, email_sent_at),
        attendance_logs(checked_in_at)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ]);

  if (!reg) notFound();

  const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
  const ticket = Array.isArray(reg.tickets) ? reg.tickets[0] : reg.tickets;
  const att = Array.isArray(reg.attendance_logs) ? reg.attendance_logs[0] : reg.attendance_logs;

  const qrDataUrl = ticket?.qr_token ? await generateQrDataUrl(ticket.qr_token) : null;
  const isConfirmed = reg.status === 'confirmed';

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/portal/registrations"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Registrations</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Admission Pass</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
              <Ticket className="h-3.5 w-3.5" />
              <span>Verified Event Pass</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
              {ev?.title ?? 'Event Admission Pass'}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold uppercase tracking-wider ${
                  isConfirmed
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }`}
              >
                {isConfirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span>Status: {reg.status.replace('_', ' ')}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                <CreditCard className="h-3 w-3" />
                <span>Payment: {reg.payment_status.replace('_', ' ')}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                <span>
                  Attendance: {att ? `Checked in at ${new Date(att.checked_in_at).toLocaleTimeString('en-IN')}` : 'Not checked in'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket QR Presentation */}
      {ticket && qrDataUrl ? (
        <TicketPrinterClient
          eventTitle={ev?.title ?? 'EDC AITR Event'}
          eventVenue={ev?.venue ?? null}
          eventStartsAt={ev?.starts_at ?? null}
          attendeeName={profile?.full_name || user.email || 'Participant'}
          category={reg.participant_category}
          ticketCode={ticket.ticket_code}
          qrDataUrl={qrDataUrl}
          emailSentAt={ticket.email_sent_at ?? null}
          registrationId={reg.id}
          initialCheckedIn={Boolean(att?.checked_in_at)}
          initialCheckedInTime={att?.checked_in_at ?? null}
        />
      ) : (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-8 text-center sm:p-12">
          <Clock className="mx-auto h-12 w-12 text-amber-500 opacity-80" />
          <h2 className="mt-4 text-base font-bold text-[var(--color-2-mood)]">
            Registration Under Processing
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] max-w-md mx-auto">
            Your admission pass and QR code will be generated once payment confirmation or seat allocation is verified by event administrators.
          </p>
        </div>
      )}
    </div>
  );
}
