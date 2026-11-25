import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getPublicEvents } from '../../lib/events/events';

export const dynamic = 'force-dynamic';

export default async function ParticipantPortalPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
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

  const confirmedRegs = (registrations ?? []).filter(r => r.status === 'confirmed').length;

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Participant Portal
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Participant Portal
        </h1>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14, maxWidth: 540, lineHeight: 1.6 }}>
          Your event registrations, QR admission passes, verified certificates, and official announcements.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/portal/registrations" className="btn btn-primary" style={{ fontSize: 13 }}>
            Your Registrations
          </Link>
          <Link href="/portal/certificates" className="btn" style={{ fontSize: 13 }}>
            Certificates
          </Link>
          <Link href="/portal/announcements" className="btn" style={{ fontSize: 13 }}>
            Announcements
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, marginTop: 32 }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-3-accent-personality)' }}>{(registrations ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Total Registrations</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{confirmedRegs}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Confirmed</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{(announcements ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Announcements</div>
        </div>
      </div>

      {/* Recent registrations */}
      <section style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Recent Registrations
          </h2>
          <Link href="/portal/registrations" style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>
        {!registrations || registrations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="card-meta" style={{ margin: 0 }}>No registrations yet. <Link href="/events">Browse events</Link> to get your QR pass.</p>
          </div>
        ) : (
          <div className="grid">
            {registrations.map((reg) => {
              const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
              const statusColor = reg.status === 'confirmed' ? 'var(--success)' : reg.status === 'cancelled' ? 'var(--danger)' : 'var(--accent-ink)';
              return (
                <article key={reg.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor }}>{reg.status.replace('_', ' ')}</span>
                    <span className="mono-meta">{reg.payment_status.replace('_', ' ')}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{ev?.title ?? 'Event'}</h3>
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {ev?.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                    {ev?.venue ? ` · ${ev.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/portal/registrations/${reg.id}`} style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>
                      View ticket →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent announcements */}
      {announcements && announcements.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
              Recent Announcements
            </h2>
            <Link href="/portal/announcements" style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>All →</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {announcements.map(a => (
              <article key={a.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>{a.title}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.body}</p>
                  </div>
                  <span className="mono-meta" style={{ flexShrink: 0 }}>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Explore upcoming */}
      {events.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
              Explore Events
            </h2>
            <Link href="/events" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>All events →</Link>
          </div>
          <div className="grid">
            {events.slice(0, 3).map(ev => (
              <article key={ev.id} className="card">
                <span className="badge">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ev.title}</h3>
                {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Link href={`/events/${ev.slug}`} style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>
                    Open &amp; Register →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
