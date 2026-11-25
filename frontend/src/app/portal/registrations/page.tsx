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

  const STATUS_COLOR: Record<string, string> = {
    confirmed: 'var(--success)',
    cancelled: 'var(--danger)',
    pending: 'var(--accent-ink)',
    waitlisted: 'var(--text-muted)',
  };

  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 6px' }}>
          <Link href="/portal" style={{ color: 'inherit', textDecoration: 'none' }}>Portal</Link> /
        </p>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Your Registrations</h1>
      </div>

      {/* Stats row */}
      {registrations && registrations.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16, marginTop: 24 }}>
          {(['confirmed','pending','cancelled'] as const).map(s => (
            <div key={s} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: STATUS_COLOR[s] }}>{(registrations ?? []).filter(r => r.status === s).length}</div>
              <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        {!registrations || registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="card-meta" style={{ margin: '0 0 20px' }}>No registrations found.</p>
            <Link href="/events" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div className="grid">
            {registrations.map((reg) => {
              const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
              const ticket = Array.isArray(reg.tickets) ? reg.tickets[0] : reg.tickets;
              const att = Array.isArray(reg.attendance_logs) ? reg.attendance_logs[0] : reg.attendance_logs;
              return (
                <article key={reg.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: STATUS_COLOR[reg.status] ?? 'var(--text-muted)' }}>
                      {reg.status.replace('_', ' ')}
                    </span>
                    <span className="mono-meta">{att ? '✓ Checked in' : 'Not checked in'}</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{ev?.title ?? 'Event'}</h2>
                  {ticket?.ticket_code && (
                    <p className="mono-meta" style={{ margin: 0 }}>Ticket: {ticket.ticket_code}</p>
                  )}
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {ev?.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                    {ev?.venue ? ` · ${ev.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                    <Link href={`/portal/registrations/${reg.id}`} className="btn btn-primary" style={{ fontSize: 14 }}>
                      {ticket ? 'Open QR Ticket' : 'View Status'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
