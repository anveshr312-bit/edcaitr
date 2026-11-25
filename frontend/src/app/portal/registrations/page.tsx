import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RegistrationsListPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
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

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/portal">← Participant Portal</Link>
      </p>
      <h1>Your Registrations</h1>
      {!registrations || registrations.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No registrations found. <Link href="/events">Browse events</Link>
          </p>
        </div>
      ) : (
        <div className="grid">
          {registrations.map((reg) => {
            const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
            const ticket = Array.isArray(reg.tickets) ? reg.tickets[0] : reg.tickets;
            const att = Array.isArray(reg.attendance_logs)
              ? reg.attendance_logs[0]
              : reg.attendance_logs;
            return (
              <article key={reg.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-accent">{reg.status.replace('_', ' ')}</span>
                  <span className="mono-meta">
                    {att ? 'Checked in' : 'Not checked in'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{ev?.title ?? 'Event'}</h2>
                {ticket?.ticket_code && (
                  <p className="mono-meta" style={{ margin: 0 }}>
                    Ticket: {ticket.ticket_code}
                  </p>
                )}
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Link href={`/portal/registrations/${reg.id}`} className="btn btn-primary">
                    {ticket ? 'Open QR Ticket' : 'View Status'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
