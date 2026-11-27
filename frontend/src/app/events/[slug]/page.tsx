import Link from 'next/link';
import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { notFound, redirect } from 'next/navigation';
import { getPublicEventBySlug } from '../../../lib/events/events';
import { getImageKitUrl } from '../../../lib/media/imagekit';
import { createClient } from '../../../lib/supabase/server';
import { SkeletonBox } from '../../../components/ui/Skeleton';
import { createPageMetadata } from '../../../lib/seo';
import { EventStructuredData, BreadcrumbStructuredData } from '../../../components/StructuredData';
import LiquidButton from '../../../components/ui/liquid-button';
import { eventAvailability } from '../../../lib/events/lifecycle';
import { EventReminderButton } from '../../../components/events/EventReminderButton';

const EventRegisterForm = nextDynamic(
  () => import('../../../components/EventRegisterForm'),
  { loading: () => <SkeletonBox height={240} borderRadius={12} /> }
);

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

function SectionHeading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="w-1.5 h-4 rounded-full bg-[#C01E30]" aria-hidden="true" />
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {children}
        </h2>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground ml-4">{subtitle}</p>}
    </div>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
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

  // Safely fetch event tracks if the table exists, fallback gracefully without blocking registration
  let tracks: { id: string; title: string }[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('event_tracks')
        .select('id,title')
        .eq('event_id', event.id)
        .order('title');
      if (!error && data) {
        tracks = data;
      }
    } catch {
      tracks = [];
    }
  }

  const requestedTrack = (await searchParams).track;
  const selectedTrack = tracks.find((track) => track.id === requestedTrack);
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
  const isCancelled = event.status === 'cancelled' || lifecycle === 'cancelled' || event.planning_stage === 'cancelled';
  const isConcluded = !isCancelled && ['completed', 'archived'].includes(lifecycle);

  // Formatted date and time strings
  const formattedDate = event.starts_at
    ? new Date(event.starts_at).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to be announced';

  const formattedTime = event.starts_at
    ? new Date(event.starts_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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

      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* ── BREADCRUMB & BACK LINK ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/40">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-border">/</span>
            <Link href="/events" className="hover:text-foreground transition-colors">
              Events
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium truncate max-w-[240px] sm:max-w-md">
              {event.title}
            </span>
          </nav>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#C01E30] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All Events
          </Link>
        </div>

        {/* ── HERO BANNER & TITLE CARD ── */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C01E30]/10 to-transparent blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-4 max-w-4xl">
            {/* Pill badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                  isCancelled
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : isConcluded
                    ? 'border-zinc-700/40 bg-zinc-800/40 text-zinc-400'
                    : lifecycle === 'ongoing'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : canRegister
                    ? 'border-[#C01E30]/30 bg-[#C01E30]/10 text-[#C01E30]'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCancelled
                      ? 'bg-rose-500'
                      : isConcluded
                      ? 'bg-zinc-400'
                      : lifecycle === 'ongoing'
                      ? 'bg-emerald-500 animate-pulse'
                      : canRegister
                      ? 'bg-[#C01E30] animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                {isCancelled
                  ? 'Cancelled / Rescheduled'
                  : isConcluded
                  ? 'Event Concluded'
                  : lifecycle === 'ongoing'
                  ? 'Happening Now'
                  : canRegister
                  ? 'Registrations Open'
                  : 'Upcoming Event'}
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/60 text-secondary-foreground border border-border/40">
                {event.is_paid && event.fee_amount ? `₹${event.fee_amount} Pass` : 'Free Entry'}
              </span>

              {event.max_capacity && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
                  Capacity: {event.max_capacity} Seats
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              {event.title}
            </h1>

            {/* Prominent Official Leadership Notice if Cancelled / Rescheduled */}
            {isCancelled && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 text-xs sm:text-sm text-rose-900 dark:text-rose-100 space-y-1.5 shadow-xs">
                <div className="font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Official Leadership Advisory: Event Cancelled / Rescheduled</span>
                </div>
                <p className="leading-relaxed">
                  {event.cancellation_reason ||
                    'This conclave has been cancelled or rescheduled by the EDC leadership board. Further announcements regarding revised dates will be published on this portal and emailed to all registered delegates.'}
                </p>
              </div>
            )}

            {/* Subhead / Summary */}
            {event.summary && (
              <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-3xl">
                {event.summary}
              </p>
            )}

            {/* Quick meta strip */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#C01E30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>
                    {formattedDate} {formattedTime ? `• ${formattedTime}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#C01E30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.venue ?? 'Acropolis Main Auditorium, Indore'}</span>
                </div>
              </div>

              {/* Remind Me Button for Upcoming Events */}
              {!isCancelled && !isConcluded && (
                <EventReminderButton eventId={event.id} />
              )}
            </div>
          </div>
        </div>

        {/* ── TWO COLUMN MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════ LEFT COLUMN: CONTENT (7 cols) ════ */}
          <div className="lg:col-span-7 space-y-10">
            {/* Poster presentation */}
            {posterUrl && (
              <div className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden shadow-md">
                <div className="relative w-full max-h-[500px] flex items-center justify-center bg-black/5 dark:bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl}
                    alt={event.title}
                    className="w-full max-h-[500px] object-contain sm:object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description & Overview */}
            {event.description && (
              <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <SectionHeading subtitle="Detailed schedule, scope, and participation guidelines">
                  About this Event
                </SectionHeading>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                  {event.description}
                </div>
              </section>
            )}

            {/* Highlights Gallery */}
            {highlights.length > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <SectionHeading subtitle="Photos, clips, and visual recaps from the session">
                  Event Highlights &amp; Media
                </SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {highlights.map((h) => {
                    const mediaUrl = getImageKitUrl(h.media_ref) ?? h.media_ref;
                    return (
                      <div
                        key={h.id}
                        className="rounded-xl border border-border/40 bg-background/50 overflow-hidden shadow-sm flex flex-col group hover:border-[#C01E30]/40 transition-all"
                      >
                        {h.media_type === 'image' && (
                          <div className="h-44 overflow-hidden bg-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={mediaUrl}
                              alt={h.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-3.5 space-y-1">
                          <p className="text-xs font-bold text-foreground leading-snug">{h.title}</p>
                          {h.caption && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{h.caption}</p>
                          )}
                          {h.media_type === 'video' && (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#C01E30] hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              Watch Video Clip
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Keynote Guests & Speakers */}
            {guests.length > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <SectionHeading subtitle="Industry leaders, venture capitalists, and guest mentors">
                  Guests &amp; Speakers
                </SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guests.map((guest) => {
                    const photoUrl = getImageKitUrl(guest.photo_ref);
                    return (
                      <div
                        key={guest.id}
                        className="rounded-xl border border-border/40 bg-background/50 p-4 flex gap-3.5 items-start hover:border-border transition-colors"
                      >
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoUrl}
                            alt={guest.full_name}
                            className="w-12 h-12 rounded-full object-cover border border-border/60 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {guest.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">{guest.full_name}</h3>
                          {guest.title && (
                            <p className="text-xs text-muted-foreground font-medium line-clamp-1">{guest.title}</p>
                          )}
                          {guest.bio && (
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">{guest.bio}</p>
                          )}
                          {guest.linkedin_url && (
                            <a
                              href={guest.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C01E30] hover:underline pt-1"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                <rect x="2" y="9" width="4" height="12" />
                                <circle cx="4" cy="4" r="2" />
                              </svg>
                              LinkedIn Profile
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Manuals & Documents */}
            {manuals.length > 0 && (
              <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <SectionHeading subtitle="Download official guidebooks, rulebooks, and participant kits">
                  Event Manuals &amp; Briefings
                </SectionHeading>
                <div className="space-y-3">
                  {manuals.map((m) => {
                    const docUrl = getImageKitUrl(m.file_ref) ?? m.file_ref;
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border/40 bg-background/50 p-4 flex items-center justify-between gap-4 hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#C01E30]/10 text-[#C01E30] flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate">{m.title}</p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                            )}
                            {m.file_size_kb && (
                              <span className="text-[10px] font-mono text-muted-foreground/70">
                                {m.file_size_kb} KB
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-secondary text-xs font-semibold text-foreground transition-colors flex-shrink-0"
                        >
                          Open Document
                        </a>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ════ RIGHT COLUMN: STICKY ACTIONS & DETAILS (5 cols) ════ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Quick Logistics Summary */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Logistics &amp; Access
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-foreground flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C01E30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-muted-foreground uppercase">Schedule</span>
                    <span className="font-semibold text-foreground">{formattedDate}</span>
                    {formattedTime && <span className="block text-muted-foreground">{formattedTime} IST</span>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-foreground flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C01E30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-muted-foreground uppercase">Auditorium / Venue</span>
                    <span className="font-semibold text-foreground">{event.venue ?? 'Acropolis Main Auditorium'}</span>
                    <span className="block text-muted-foreground text-xs">Acropolis Institute, Bypass Road, Indore</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-foreground flex-shrink-0">
                    <svg className="w-4 h-4 text-[#C01E30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-muted-foreground uppercase">Participation Pass</span>
                    <span className="font-bold text-[#C01E30] text-sm">
                      {event.is_paid && event.fee_amount ? `₹${event.fee_amount} per delegate` : 'Free Registration'}
                    </span>
                    <span className="block text-muted-foreground text-[11px]">Includes digital gate pass &amp; verification</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Action Card */}
            <div id="registration" className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="text-base font-bold text-foreground">
                  {isCancelled ? 'Event Notice' : isConcluded ? 'Event Status' : 'Reserve Your Pass'}
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isCancelled ? 'Cancelled' : canRegister ? 'Fast-Track Pass' : 'Concluded'}
                </span>
              </div>

              {/* Cancelled State */}
              {isCancelled && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Registrations Discontinued</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      This event has been officially cancelled or rescheduled. If you already held an admission pass, our team has notified you via registered email.
                    </p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all mt-2"
                  >
                    View Active Summits &amp; Events →
                  </Link>
                </div>
              )}

              {/* If registration is open */}
              {!isCancelled && canRegister && (
                <>
                  {/* Track selector if tracks exist */}
                  {tracks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground block">
                        Select Participation Track:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tracks.map((track) => {
                          const isActive = track.id === selectedTrack?.id;
                          return (
                            <Link
                              key={track.id}
                              href={`/events/${event.slug}?track=${track.id}#registration`}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isActive
                                  ? 'bg-[#C01E30] text-white border-[#C01E30] shadow-sm'
                                  : 'bg-background hover:bg-secondary text-foreground border-border/60'
                              }`}
                            >
                              {track.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {tracks.length > 0 && !selectedTrack ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Please select a participation track above to claim your pass.
                    </div>
                  ) : userId ? (
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
                    <div className="space-y-4 pt-1">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Sign in with your verified student or delegate account to claim your entry pass and digital QR ticket.
                      </p>
                      <LiquidButton
                        href={`/account?next=${encodeURIComponent(back)}`}
                        variant="accent"
                        className="w-full flex items-center justify-center font-bold text-sm py-3"
                      >
                        Sign in to Register →
                      </LiquidButton>
                    </div>
                  )}
                </>
              )}

              {/* Concluded state */}
              {!isCancelled && isConcluded && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Registrations Closed</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      This conclave has concluded. Check out our upcoming summits and workshops on the events calendar.
                    </p>
                  </div>
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all mt-2"
                  >
                    View All Upcoming Events →
                  </Link>
                </div>
              )}

              {/* Not open yet */}
              {!isCancelled && !canRegister && !isConcluded && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/40 text-center space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Registrations for this event have not opened yet.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Stay tuned or follow our official updates on Instagram.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
