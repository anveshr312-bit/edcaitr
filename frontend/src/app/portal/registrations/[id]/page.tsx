import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
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

  const { data: { user }, error } = await supabase.auth.getUser();
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

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href="/portal/registrations" style={{ color: 'inherit', textDecoration: 'none' }}>Registrations</Link> / Ticket Pass
          </span>
        </div>
        <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          {ev?.title ?? 'Event Registration'}
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-accent">Status: {reg.status.replace('_', ' ')}</span>
          <span className="badge" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}>
            Payment: {reg.payment_status.replace('_', ' ')}
          </span>
          <span className="badge" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}>
            Attendance: {att ? `Checked in (${new Date(att.checked_in_at).toLocaleTimeString('en-IN')})` : 'Not checked in'}
          </span>
        </div>
      </div>

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
        />
      ) : (
        <div className="card">
          <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>Ticket Pending</h2>
          <p className="card-meta" style={{ margin: 0 }}>
            {reg.payment_status === 'pending_verification'
              ? `Your payment reference (${reg.payment_ref}) is awaiting verification by the Event Lead. Your QR ticket will be issued and emailed once verified.`
              : 'No active ticket is issued for this registration.'}
          </p>
        </div>
      )}
    </div>
  );
}
