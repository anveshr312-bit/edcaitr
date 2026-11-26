import Link from 'next/link';
import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { notFound, redirect } from 'next/navigation';
import { getPublicEventBySlug } from '../../../lib/events/events';
import { getImageKitUrl } from '../../../lib/media/imagekit';
import { createClient } from '../../../lib/supabase/server';
import { SkeletonBox } from '../../../components/ui/Skeleton';
import { createPageMetadata, SITE_CONFIG } from '../../../lib/seo';
import { EventStructuredData, BreadcrumbStructuredData } from '../../../components/StructuredData';

const EventRegisterForm = nextDynamic(
  () => import('../../../components/EventRegisterForm'),
  { loading: () => <SkeletonBox height={180} borderRadius={8} /> }
);
import LiquidButton from '../../../components/ui/liquid-button';
import { eventAvailability } from '../../../lib/events/lifecycle';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await getPublicEventBySlug(slug);

  if (!event) {
    return {
      title: 'Event Not Found | EDC AITR',
      robots: { index: false, follow: false },
    };
  }

  const posterUrl = getImageKitUrl(event.poster_ref);
  const cleanSummary =
    event.summary ||
    (event.description ? event.description.slice(0, 160) : null) ||
    `Official event registrations and details for ${event.title} hosted by EDC AITR in Indore.`;

  return createPageMetadata({
    title: `${event.title} — Events`,
    description: cleanSummary,
    path: `/events/${event.slug}`,
    ogImage: posterUrl || '/og-image.png',
    ogType: 'article',
    publishedTime: event.starts_at || undefined,
    modifiedTime: event.ends_at || undefined,
    keywords: [
      event.title,
      'EDC AITR event',
      'Student entrepreneurship conclave',
      'Acropolis Indore event registration',
      event.venue || 'Acropolis Indore',
    ],
  });
}

/** Reusable section heading with 2px vermilion left border */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 20px',
        fontSize: '1.2rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 3,
          height: '1.2em',
          background: '#C01E30',
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      {children}
    </h2>
  );
}

export default async function EventDetailPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ track?: string }>;
}) {
  const { slug } = await params;
  const { event, guests, highlights, manuals } = await getPublicEventBySlug(slug);

  if (!event) {
    if (slug === 'fokus-x-e-summit-2026') redirect('/#summit-2026');
    if (slug === 'pitchbiz-investment-arena-2026') redirect('/events#pitchbiz');
    notFound();
  }

  const supabase = await createClient();
  const trackResult = supabase ? await supabase.from('event_tracks').select('id,title').eq('event_id', event.id).order('title') : null;
  const tracks: {id: string; title: string}[] = trackResult?.data ?? [];
  const requestedTrack = (await searchParams).track;
  const selectedTrack = tracks.find(track => track.id === requestedTrack);
  const back = `/events/${event.slug}${selectedTrack ? '?track=' + selectedTrack.id : ''}#registration`;
  let userId: string | null = null;
  let existingReg: { id: string; status: string } | null = null;
  let upiDetails: { upi_id: string | null; upi_qr_ref: string | null } = { upi_id: null, upi_qr_ref: null };

  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    userId = auth.user?.id ?? null;

    if (userId) {
      const [{ data: reg }, { data: evPay }] = await Promise.all([
        supabase
          .from('registrations')
          .select('id, status')
          .eq('event_id', event.id)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('events')
          .select('upi_id, upi_qr_ref')
          .eq('id', event.id)
          .maybeSingle(),
      ]);
      existingReg = reg;
      if (evPay) upiDetails = evPay;
    }
  }

  const posterUrl = getImageKitUrl(event.poster_ref);
  const upiQrUrl = getImageKitUrl(upiDetails.upi_qr_ref);
  const { lifecycle, open: canRegister } = eventAvailability(event);
  const isConcluded = ['completed', 'archived'].includes(lifecycle);

  return (
    <>
      <EventStructuredData
        event={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          summary: event.summary,
          description: event.description,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          venue: event.venue,
          isPaid: event.is_paid,
          feeAmount: event.fee_amount,
          bannerUrl: posterUrl,
          status: event.status,
          registrationOpen: canRegister,
        }}
      />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'Events', path: '/events' },
          { name: event.title, path: `/events/${event.slug}` },
        ]}
      />
      {/* ── BREADCRUMB ── */}
      <p style={{ marginBottom: 24, fontSize: '0.9rem' }}>
        <Link
          href="/events"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All events
        </Link>
      </p>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* ════ LEFT COLUMN (60%) ════ */}
        <div>
          {/* Title */}
          <h1
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            {event.title}
          </h1>

          {/* Poster hero */}
          {posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt={event.title}
              style={{
                width: '100%',
                borderRadius: 'var(--radius-panel)',
                objectFit: 'cover',
                display: 'block',
                marginBottom: 28,
                border: '1px solid var(--border-hairline)',
              }}
            />
          )}

          {/* Summary + Description */}
          {(event.summary || event.description) && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeading>About this event</SectionHeading>
              {event.summary && (
                <p style={{ fontWeight: 500, marginBottom: 12, fontSize: '1.05rem' }}>{event.summary}</p>
              )}
              {event.description && (
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {event.description}
                </div>
              )}
            </section>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeading>Event Highlights</SectionHeading>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                {highlights.map((h) => {
                  const mediaUrl = getImageKitUrl(h.media_ref) ?? h.media_ref;
                  return (
                    <div
                      key={h.id}
                      style={{
                        borderRadius: 'var(--radius-card)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-hairline)',
                        background: 'var(--surface)',
                      }}
                    >
                      {h.media_type === 'image' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl}
                          alt={h.title}
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{h.title}</p>
                        {h.caption && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {h.caption}
                          </p>
                        )}
                        {h.media_type === 'video' && (
                          <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{ marginTop: 8, fontSize: '0.78rem', display: 'inline-block' }}
                          >
                            Watch video
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Manuals */}
          {manuals.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeading>Manuals &amp; Documents</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {manuals.map((m) => {
                  const docUrl = getImageKitUrl(m.file_ref) ?? m.file_ref;
                  return (
                    <div
                      key={m.id}
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                        padding: '16px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{m.title}</p>
                          {m.description && (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {m.description}
                            </p>
                          )}
                          {m.file_size_kb && (
                            <span className="mono-meta" style={{ fontSize: '0.75rem' }}>
                              {m.file_size_kb} KB
                            </span>
                          )}
                        </div>
                      </div>
                      <a href={docUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ flexShrink: 0 }}>
                        Open
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Guests & Speakers */}
          {guests.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeading>Guests &amp; Speakers</SectionHeading>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {guests.map((guest) => {
                  const photoUrl = getImageKitUrl(guest.photo_ref);
                  return (
                    <div key={guest.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={guest.full_name}
                          className="avatar"
                          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <div>
                        <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700 }}>{guest.full_name}</h3>
                        {guest.title && (
                          <p className="card-meta" style={{ margin: '0 0 6px' }}>{guest.title}</p>
                        )}
                        {guest.bio && (
                          <p className="card-meta" style={{ margin: '0 0 8px', fontSize: '0.85rem' }}>{guest.bio}</p>
                        )}
                        {guest.linkedin_url && (
                          <a
                            href={guest.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#C01E30', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                              <rect x="2" y="9" width="4" height="12" />
                              <circle cx="4" cy="4" r="2" />
                            </svg>
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ════ RIGHT COLUMN (40%) — sticky registration panel ════ */}
        <div style={{ position: 'sticky', top: 24 }}>
          {/* Event metadata card */}
          <div
            className="card"
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span className="badge badge-accent">
                {isConcluded ? 'Event concluded' : lifecycle}
              </span>
              <span className="badge">
                {event.is_paid && event.fee_amount ? `₹${event.fee_amount}` : 'Free Entry'}
              </span>
              {event.max_capacity && (
                <span className="badge">Capacity: {event.max_capacity}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2, flexShrink: 0 }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                    When
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {event.starts_at
                      ? new Date(event.starts_at).toLocaleString('en-IN', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })
                      : 'To be announced'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ marginTop: 2, flexShrink: 0 }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                    Venue
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {event.venue ?? 'To be announced'}
                  </span>
                </div>
              </div>

              {event.is_paid && event.fee_amount && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                      Registration fee
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#C01E30' }}>
                      ₹{event.fee_amount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Register section */}
          {canRegister && (
            <div id="registration" className="card">
              <SectionHeading>Register</SectionHeading>
              {tracks.length > 0 && <nav aria-label="Select registration track">{tracks.map(track => <Link key={track.id} className="btn" aria-current={track.id === selectedTrack?.id ? 'true' : undefined} href={`/events/${event.slug}?track=${track.id}#registration`}>{track.title}</Link>)}</nav>}
              {trackResult?.error || !trackResult ? <p>Registration options are temporarily unavailable.</p> : tracks.length > 0 && !selectedTrack ? <p>Select a track to continue.</p> : userId ? (
                <EventRegisterForm
                  trackId={selectedTrack?.id ?? null}
                  eventId={event.id}
                  isPaid={event.is_paid}
                  feeAmount={event.fee_amount}
                  upiId={upiDetails.upi_id}
                  upiQrUrl={upiQrUrl}
                  existingRegistrationId={existingReg?.id ?? null}
                  existingStatus={existingReg?.status ?? null}
                />
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Sign in to your account to register for this event.
                  </p>
                  <LiquidButton href={`/account?next=${encodeURIComponent(back)}`} variant="accent" style={{ width: '100%' }}>
                    Sign in to register
                  </LiquidButton>
                </div>
              )}


            </div>
          )}

          {isConcluded && (
            <div
              className="card"
              style={{
                background: 'var(--surface-subtle)',
                borderColor: 'var(--border-hairline)',
                textAlign: 'center',
                padding: 24,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ margin: '0 auto 12px', display: 'block' }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                This event has concluded. Thank you to all participants.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
