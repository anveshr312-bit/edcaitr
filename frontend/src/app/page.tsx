import Link from 'next/link';
import { getPublicEvents } from '../lib/events/events';
import { getImageKitUrl } from '../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await getPublicEvents(false);
  const featured = events.slice(0, 3);

  return (
    <>
      <section className="hero">
        <span className="badge badge-accent">Acropolis Institute of Technology &amp; Research</span>
        <h1 style={{ marginTop: 12 }}>Entrepreneurship Development Cell, AITR</h1>
        <p>
          Fostering student founders, startup thinking, and hands-on venture building through flagship
          summits, speaker sessions, workshops, and a verified E-Cell builder community.
        </p>
        <div className="actions-row">
          <Link href="/events" className="btn btn-primary">
            Explore Events
          </Link>
          <Link href="/account" className="btn">
            Sign in / Create Account
          </Link>
          <Link href="/team" className="btn">
            Meet the Team
          </Link>
        </div>
      </section>

      <section>
        <h2>What We Do</h2>
        <div className="grid">
          <article className="card">
            <h3>Flagship Events &amp; Summits</h3>
            <p className="card-meta">
              Open workshops, founder fireside chats, pitch competitions, and E-Summit sessions for
              students and external builders.
            </p>
          </article>
          <article className="card">
            <h3>Student Venture Support</h3>
            <p className="card-meta">
              Connecting early-stage campus ideas with alumni founders, mentors, and practical execution
              guidance.
            </p>
          </article>
          <article className="card">
            <h3>Student-Led Execution</h3>
            <p className="card-meta">
              Structured Core Team operations across Design, AV, Logistics, Guest Relations, Stage, and
              Registration.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Highlighted Events</h2>
          <Link href="/events">View all events →</Link>
        </div>

        {featured.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              No public events are published yet. Upcoming sessions will appear here as soon as they
              are announced.
            </p>
          </div>
        ) : (
          <div className="grid">
            {featured.map((event) => {
              const posterUrl = getImageKitUrl(event.poster_ref);
              return (
                <article key={event.id} className="card">
                  {posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={posterUrl} alt={event.title} className="poster" />
                  )}
                  <div>
                    <span className="badge">{event.status.replace('_', ' ')}</span>
                  </div>
                  <h3 style={{ margin: 0 }}>{event.title}</h3>
                  {event.summary && <p className="card-meta" style={{ margin: 0 }}>{event.summary}</p>}
                  <p className="card-meta" style={{ margin: 0 }}>
                    {event.starts_at
                      ? new Date(event.starts_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Date TBA'}
                    {event.venue ? ` · ${event.venue}` : ''}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/events/${event.slug}`}>View details →</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
