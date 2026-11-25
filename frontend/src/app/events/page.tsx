import Link from 'next/link';
import { getPublicEvents } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getPublicEvents(false);

  return (
    <>
      <h1>Events</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Upcoming and concluded public events organized by E-Cell AITR.
      </p>

      {events.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No public events are currently listed. Check back soon for upcoming announcements.
          </p>
        </div>
      ) : (
        <div className="grid">
          {events.map((event) => {
            const posterUrl = getImageKitUrl(event.poster_ref);
            return (
              <article key={event.id} className="card">
                {posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={posterUrl} alt={event.title} className="poster" />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-accent">
                    {event.status === 'closed' ? 'Concluded' : event.status.replace('_', ' ')}
                  </span>
                  <span className="mono-meta">
                    {event.is_paid && event.fee_amount ? `₹${event.fee_amount}` : 'Free'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{event.title}</h2>
                {event.summary && <p className="card-meta" style={{ margin: 0 }}>{event.summary}</p>}
                <p className="mono-meta" style={{ margin: 0 }}>
                  {event.starts_at
                    ? new Date(event.starts_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Schedule TBA'}
                  {event.venue ? ` · ${event.venue}` : ''}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Link href={`/events/${event.slug}`}>Open event details</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
