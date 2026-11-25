import Link from 'next/link';
import { getPublicEvents, getPublicTeamProfiles } from '../lib/events/events';
import { getImageKitUrl } from '../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [events, team] = await Promise.all([
    getPublicEvents(false),
    getPublicTeamProfiles(),
  ]);

  const featured = events.slice(0, 3);
  const activeCount = events.filter((e) => e.status === 'published' || e.status === 'ongoing').length;

  return (
    <>
      <section className="hero-split">
        <div className="hero-copy">
          <span className="stamp-label">
            <span className="stamp-dot" />
            Acropolis Institute of Technology &amp; Research
          </span>
          <h1 style={{ marginTop: 16 }}>Student-led entrepreneurship and venture building</h1>
          <p>
            EDC AITR connects students, early-stage founders, and alumni through campus summits,
            practical workshops, and structured operational teams.
          </p>
          <div className="actions-row">
            <Link href="/events" className="btn btn-primary">
              Explore events
            </Link>
            <Link href="/account" className="btn">
              Sign in or register
            </Link>
          </div>
        </div>

        <aside className="hero-ledger" aria-label="Organization snapshot">
          <div className="ledger-row">
            <span className="ledger-label">Published events</span>
            <span className="ledger-value">{events.length}</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Active upcoming</span>
            <span className="ledger-value">{activeCount}</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Public team members</span>
            <span className="ledger-value">{team.length}</span>
          </div>
          <div className="ledger-row">
            <span className="ledger-label">Operational teams</span>
            <span className="ledger-value">12</span>
          </div>
        </aside>
      </section>

      <section>
        <h2>How EDC AITR operates</h2>
        <div className="grid">
          <article className="card">
            <h3>Flagship summits &amp; sessions</h3>
            <p className="card-meta" style={{ margin: 0 }}>
              Open workshops, founder conversations, and pitch sessions for students and external
              builders.
            </p>
          </article>
          <article className="card">
            <h3>12 specialized event teams</h3>
            <p className="card-meta" style={{ margin: 0 }}>
              Core Team members execute across Registration, AV, Stage, Logistics, Design, Anchoring,
              and Media.
            </p>
          </article>
          <article className="card">
            <h3>Verified alumni continuity</h3>
            <p className="card-meta" style={{ margin: 0 }}>
              Former members retain verified tenure records and transition into the private Alumni
              Connect network.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Highlighted events</h2>
          <Link href="/events">All events</Link>
        </div>

        {featured.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              No public events are published yet. New sessions will appear here once published by an
              Event Lead.
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-accent">
                      {event.status === 'closed' ? 'Concluded' : event.status.replace('_', ' ')}
                    </span>
                    <span className="mono-meta">
                      {event.starts_at
                        ? new Date(event.starts_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Date TBA'}
                    </span>
                  </div>
                  <h3 style={{ margin: 0 }}>{event.title}</h3>
                  {event.summary && <p className="card-meta" style={{ margin: 0 }}>{event.summary}</p>}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/events/${event.slug}`}>View details</Link>
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
