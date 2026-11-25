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
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href="/portal" style={{ color: 'inherit', textDecoration: 'none' }}>Portal</Link> / Registrations
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Your Registrations
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 540, lineHeight: 1.6 }}>
          Track confirmed event passes, payment verification status, and attendance check-in records.
        </p>
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
