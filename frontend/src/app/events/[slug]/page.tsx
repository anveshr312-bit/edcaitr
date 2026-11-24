import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicEventBySlug } from '../../../lib/events/events';
import { getImageKitUrl } from '../../../lib/media/imagekit';

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { event, guests } = await getPublicEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const posterUrl = getImageKitUrl(event.poster_ref);
  const isConcluded = event.status === 'closed' || event.status === 'archived';

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/events">← All events</Link>
      </p>

      <article className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-accent">
            {isConcluded ? 'Event concluded' : event.status.replace('_', ' ')}
          </span>
          <span className="badge">
            {event.is_paid && event.fee_amount ? `₹${event.fee_amount}` : 'Free Entry'}
          </span>
          {event.max_capacity && <span className="badge">Capacity: {event.max_capacity}</span>}
        </div>

        <h1 style={{ marginTop: 8 }}>{event.title}</h1>

        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={event.title}
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 10 }}
          />
        )}

        <div className="card-meta" style={{ display: 'grid', gap: 6, margin: '12px 0' }}>
          <div>
            <strong>When:</strong>{' '}
            {event.starts_at
              ? new Date(event.starts_at).toLocaleString('en-IN', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : 'To be announced'}
          </div>
          <div>
            <strong>Venue:</strong> {event.venue ?? 'To be announced'}
          </div>
        </div>

        {event.summary && <p style={{ fontWeight: 500 }}>{event.summary}</p>}
        <div style={{ whiteSpace: 'pre-wrap' }}>{event.description}</div>

        {!isConcluded && (
          <div className="actions-row">
            <Link href="/account" className="btn btn-primary">
              Sign in to Register (Phase 3)
            </Link>
          </div>
        )}
      </article>

      {guests.length > 0 && (
        <section>
          <h2>Guests &amp; Speakers</h2>
          <div className="grid">
            {guests.map((guest) => {
              const photoUrl = getImageKitUrl(guest.photo_ref);
              return (
                <article key={guest.id} className="card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    {photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt={guest.full_name} className="avatar" />
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{guest.full_name}</h3>
                      {guest.title && <p className="card-meta" style={{ margin: 0 }}>{guest.title}</p>}
                    </div>
                  </div>
                  {guest.bio && <p className="card-meta" style={{ margin: 0 }}>{guest.bio}</p>}
                  {guest.linkedin_url && (
                    <a href={guest.linkedin_url} target="_blank" rel="noopener noreferrer">
                      LinkedIn Profile →
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
