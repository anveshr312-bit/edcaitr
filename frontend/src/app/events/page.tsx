import Link from 'next/link';
import { getPublicEvents } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getPublicEvents(false);
  const upcoming = events.filter(e => e.status === 'published' || e.status === 'ongoing');
  const concluded = events.filter(e => e.status === 'closed');

  return (
    <>
      {/* Page header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '48px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>EDC AITR</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, lineHeight: 1.1 }}>Events</h1>
        <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 540 }}>
          Upcoming and concluded public events organized by the Entrepreneurship Development Cell at AITR.
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No public events yet. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 56, marginTop: 48 }}>
          {upcoming.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
                Upcoming &amp; Active ({upcoming.length})
              </h2>
              <div className="grid">
                {upcoming.map((ev) => {
                  const posterUrl = getImageKitUrl(ev.poster_ref);
                  return (
                    <article key={ev.id} className="card">
                      {posterUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={posterUrl} alt={ev.title} className="poster" />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-accent">{ev.status.replace('_', ' ')}</span>
                        <span className="mono-meta">{ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}</span>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{ev.title}</h2>
                      {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                      <p className="mono-meta" style={{ margin: 0 }}>
                        {ev.starts_at ? new Date(ev.starts_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Schedule TBA'}
                        {ev.venue ? ` · ${ev.venue}` : ''}
                      </p>
                      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                        <Link href={`/events/${ev.slug}`} className="btn btn-primary" style={{ fontSize: 14 }}>
                          Open &amp; Register
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {concluded.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 20px', borderLeft: '3px solid var(--border-hairline)', paddingLeft: 12 }}>
                Concluded ({concluded.length})
              </h2>
              <div className="grid">
                {concluded.map((ev) => {
                  const posterUrl = getImageKitUrl(ev.poster_ref);
                  return (
                    <article key={ev.id} className="card" style={{ opacity: 0.85 }}>
                      {posterUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={posterUrl} alt={ev.title} className="poster" style={{ filter: 'grayscale(0.4)' }} />
                      )}
                      <span className="badge">Concluded</span>
                      <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{ev.title}</h2>
                      {ev.summary && <p className="card-meta" style={{ margin: 0 }}>{ev.summary}</p>}
                      <p className="mono-meta" style={{ margin: 0 }}>
                        {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}
                        {ev.venue ? ` · ${ev.venue}` : ''}
                      </p>
                      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                        <Link href={`/events/${ev.slug}`} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                          View highlights →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
