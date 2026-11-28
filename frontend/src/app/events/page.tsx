import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicEvents, type PublicEvent } from '../../lib/events/events';
import { getImageKitUrl } from '../../lib/media/imagekit';
import { createPageMetadata } from '../../lib/seo';
import { BreadcrumbStructuredData } from '../../components/StructuredData';
import { eventAvailability } from '../../lib/events/lifecycle';
import { createClient } from '../../lib/supabase/server';
import { Calendar, MapPin, Ticket, ArrowRight, Sparkles, Radio, Award, CheckCircle2, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Events & Summits — Live Conclaves, Hackathons & Masterclasses',
  description:
    'Explore upcoming entrepreneurship summits, Kriyeta hackathons, PitchBiz investor arenas, and masterclasses hosted by EDC AITR in Indore.',
  path: '/events',
  keywords: [
    'EDC AITR events',
    'Startup events in Indore',
    'Entrepreneurship workshops in Indore',
    'FOKUS X E-Summit 2026',
    'Kriyeta Hackathon',
    'PitchBiz Acropolis',
  ],
});

const PAST_EDITIONS = [
  {
    title: 'E-Summit 2025',
    dates: 'Annual Conclave',
    desc: 'Central India’s premier student entrepreneurship summit featuring venture pitches, fireside keynotes, and founder circles.',
  },
  {
    title: 'E-Summit 2024 & 2023',
    dates: 'Pioneering Editions',
    desc: 'Established the student venture ecosystem at Acropolis with over 100+ startups evaluated and dozens of angel interactions.',
  },
  {
    title: 'TEDx Acropolis & TEDx Vijaynagar',
    dates: 'Ideas Worth Spreading',
    desc: 'Curated platforms bringing together artists, tech pioneers, and social innovators for thought-provoking talks.',
  },
  {
    title: 'Kriyeta National Hackathon',
    dates: 'Product Prototyping',
    desc: 'Over 48 hours of relentless engineering and design, turning student ideas into demonstrable working MVP code.',
  },
];

export default async function EventsPage() {
  const [events, supabase] = await Promise.all([
    getPublicEvents(true),
    createClient(),
  ]);

  let userRegistrations: Array<{
    id: string;
    status: string;
    payment_status: string;
    created_at: string;
    events: {
      id?: string;
      title: string;
      slug: string;
      starts_at: string | null;
      venue: string | null;
      poster_ref: string | null;
    } | null;
  }> = [];

  let userCertificates: Array<{
    id: string;
    certificate_code: string;
    title: string;
    issued_at: string;
    event_id?: string;
    events: {
      title: string;
      slug: string;
    } | null;
  }> = [];

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [regRes, certRes] = await Promise.all([
          supabase
            .from('registrations')
            .select('id, status, payment_status, created_at, events(id, title, slug, starts_at, venue, poster_ref)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('certificates')
            .select('id, certificate_code, title, issued_at, event_id, events(title, slug)')
            .eq('user_id', user.id)
            .order('issued_at', { ascending: false }),
        ]);

        if (regRes.data) {
          userRegistrations = regRes.data as any;
        }
        if (certRes.data) {
          userCertificates = certRes.data as any;
        }
      }
    } catch {
      // Graceful fallback if user session or database tables are unavailable
    }
  }

  // Group events by priority
  const liveEvents = events.filter((e) => eventAvailability(e).lifecycle === 'ongoing');
  const upcomingEvents = events.filter((e) => eventAvailability(e).lifecycle === 'upcoming');
  const concludedEvents = events.filter((e) => ['completed', 'archived'].includes(eventAvailability(e).lifecycle));
  const cancelledEvents = events.filter(
    (e) => e.status === 'cancelled' || eventAvailability(e).lifecycle === 'cancelled'
  );

  const primaryUpcoming = upcomingEvents[0] ?? null;
  const remainingUpcoming = upcomingEvents.slice(1);

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', path: '/' },
          { name: 'Events & Summits', path: '/events' },
        ]}
      />

      {/* Header Band */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-10 lg:p-12 shadow-xs relative">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border/80 bg-secondary/60 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C01E30]" />
            Official conclave &amp; summit calendar
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
            Events &amp; Summits
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Discover upcoming student founder summits, Kriyeta hackathons, PitchBiz investor discovery sessions, and hands-on workshops hosted by the Entrepreneurship Development Cell (EDC AITR) and AIIH Foundation.
          </p>
        </div>
      </section>

      {/* ── USER'S REGISTERED EVENTS & VERIFIED CERTIFICATES ── */}
      {(userRegistrations.length > 0 || userCertificates.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C01E30]" />
              <h2 className="text-xs font-semibold tracking-wide text-[#C01E30] dark:text-[#E67C87]">
                Events You Registered &amp; Verified Certificates
              </h2>
            </div>
            <Link
              href="/portal/registrations"
              className="text-xs font-medium text-muted-foreground hover:text-[#C01E30] transition-colors inline-flex items-center gap-1"
            >
              <span>Manage all passes</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRegistrations.map((reg) => {
              const ev = reg.events;
              const matchingCert = userCertificates.find(
                (c) => (c.event_id && ev?.id && c.event_id === ev.id) || (c.events?.slug === ev?.slug)
              );

              return (
                <div
                  key={reg.id}
                  className="rounded-2xl border border-border/70 bg-card p-5 flex flex-col justify-between hover:border-border transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {reg.status === 'confirmed' ? 'Pass confirmed' : reg.status}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {reg.payment_status === 'free' ? 'Free pass' : reg.payment_status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {ev?.title ?? 'Registered Event'}
                      </h3>
                      {ev?.venue && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground/70" />
                          <span>{ev.venue}</span>
                        </p>
                      )}
                    </div>

                    {matchingCert && (
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Award className="h-4 w-4 shrink-0" />
                          <span className="font-semibold truncate">{matchingCert.title}</span>
                        </div>
                        <Link
                          href="/portal/certificates"
                          className="text-[10px] font-mono underline hover:text-amber-800 dark:hover:text-amber-300 shrink-0"
                        >
                          View cert →
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>
                        {ev?.starts_at
                          ? new Date(ev.starts_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Schedule TBA'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ev?.slug && (
                        <Link
                          href={`/events/${ev.slug}`}
                          className="px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-[11px] font-medium transition-colors"
                        >
                          Details
                        </Link>
                      )}
                      <Link
                        href={`/portal/registrations/${reg.id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#C01E30] hover:bg-[#a01828] text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Ticket className="h-3 w-3" />
                        <span>View pass</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Standalone certificates that do not correspond to the shown registrations */}
            {userCertificates
              .filter(
                (c) =>
                  !userRegistrations.some(
                    (r) => (c.event_id && r.events?.id && c.event_id === r.events.id) || (c.events?.slug === r.events?.slug)
                  )
              )
              .map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        <Award className="h-3 w-3" />
                        Official credential
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {cert.certificate_code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground leading-snug">
                        {cert.title}
                      </h3>
                      {cert.events?.title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Conferred for {cert.events.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Issued {new Date(cert.issued_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      href="/portal/certificates"
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <Award className="h-3 w-3" />
                      <span>View certificate</span>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── PRIORITY 1: LIVE NOW EVENTS (If active) ── */}
      {liveEvents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
              Happening live right now
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {liveEvents.map((ev) => {
              const poster = getImageKitUrl(ev.poster_ref);
              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      <Radio className="h-3 w-3" />
                      Live session in progress
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{ev.title}</h3>
                    {ev.summary && <p className="text-sm text-muted-foreground">{ev.summary}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        {ev.venue ?? 'Acropolis Main Auditorium'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/events/${ev.slug}`}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    View live event &amp; check-in →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── PRIORITY 2: UPCOMING CONCLAVES & BENTO GRID ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Upcoming conclaves &amp; arenas
            </h2>
            <p className="text-xs text-muted-foreground">
              Secure your delegate pass for Central India’s premier venture summits.
            </p>
          </div>
        </div>

        {/* Bento Grid Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Bento Item 1: Large Spotlight (2 cols, 2 rows on lg) */}
          {primaryUpcoming ? (
            <div className="md:col-span-2 lg:col-span-2 rounded-2xl border border-border/70 bg-card p-6 sm:p-8 flex flex-col justify-between group hover:border-border transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#C01E30]/10 text-[#C01E30] dark:text-[#E67C87] border border-[#C01E30]/20">
                    <Sparkles className="h-3 w-3" />
                    Flagship upcoming
                  </span>
                  <span className="text-xs font-mono text-muted-foreground bg-secondary/80 px-2.5 py-0.5 rounded-md">
                    {primaryUpcoming.is_paid && primaryUpcoming.fee_amount ? `₹${primaryUpcoming.fee_amount}` : 'Free entry'}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-[#C01E30] transition-colors">
                  {primaryUpcoming.title}
                </h3>

                {primaryUpcoming.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {primaryUpcoming.summary}
                  </p>
                )}

                {primaryUpcoming.poster_ref && (
                  <div className="rounded-xl overflow-hidden border border-border/40 max-h-56 bg-secondary/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageKitUrl(primaryUpcoming.poster_ref) || primaryUpcoming.poster_ref}
                      alt={primaryUpcoming.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#C01E30]" />
                  <span>
                    {primaryUpcoming.starts_at
                      ? new Date(primaryUpcoming.starts_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Date TBA'}
                  </span>
                </div>

                <Link
                  href={`/events/${primaryUpcoming.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C01E30] hover:bg-[#a01828] text-white text-xs font-semibold transition-colors"
                >
                  Reserve pass →
                </Link>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-border/60 p-8 text-center flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Announcements pending</h3>
              <p className="text-xs text-muted-foreground">New event calendar tracks are being finalized by the Core Team.</p>
            </div>
          )}

          {/* Bento Item 2: PitchBiz Investment Arena */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between hover:border-border transition-all">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-[#C01E30]">
                <Ticket className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">PitchBiz 5.0 Arena</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct live pitching desk before marquee angel investors and venture capitalists. Grants, debt syndication, and NIDHI-EIR pipeline.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <span className="text-[11px] text-muted-foreground block mb-2">
                Investor track · Central India
              </span>
              <Link
                href="/#summit-2026"
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-[#C01E30] transition-colors"
              >
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Bento Item 3: Campus Startup Initiative (CSI) */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between hover:border-border transition-all">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-foreground">
                <Award className="h-4 w-4 text-[#C01E30]" />
              </div>
              <h3 className="text-base font-bold text-foreground">CSI Pre-Incubation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                8-month structured cohort taking student ideas from lab workbench to incorporation, cloud credits, and DPIIT recognition without upfront equity.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <span className="text-[11px] text-muted-foreground block mb-2">
                AIIH Foundation bay
              </span>
              <Link
                href="/#csi"
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-[#C01E30] transition-colors"
              >
                Explore pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Additional Upcoming Events (if any) */}
          {remainingUpcoming.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between hover:border-border transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#C01E30]">Upcoming</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {ev.is_paid && ev.fee_amount ? `₹${ev.fee_amount}` : 'Free'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{ev.title}</h3>
                {ev.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{ev.summary}</p>
                )}
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Schedule TBA'}
                </span>
                <Link
                  href={`/events/${ev.slug}`}
                  className="text-xs font-semibold text-[#C01E30] hover:underline"
                >
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ADVISORY: CANCELLED & RESCHEDULED EVENTS (Never vanished / 404) ── */}
      {cancelledEvents.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/40">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <span>Official Leadership Advisories</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Rescheduled &amp; Cancelled Conclaves
            </h2>
            <p className="text-xs text-muted-foreground">
              Transparent institutional notices for cancelled or postponed summits and masterclasses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Cancelled / Rescheduled
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-IN') : 'Date TBA'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-through opacity-85">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {ev.cancellation_reason || ev.summary || 'Official cancellation notice recorded.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    Read Official Notice →
                  </span>
                  <Link
                    href={`/events/${ev.slug}`}
                    className="text-xs font-semibold text-foreground hover:text-[#C01E30] transition-colors"
                  >
                    View Advisory
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRIORITY 3: CONCLUDED CONCLAVES & ARCHIVES ── */}
      <section className="space-y-6 pt-6 border-t border-border/40">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            Previous conclaves &amp; flagship editions
          </h2>
          <p className="text-xs text-muted-foreground">
            A historical archive of student entrepreneurship milestones at Acropolis Indore.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PAST_EDITIONS.map((ed) => (
            <div
              key={ed.title}
              className="rounded-2xl border border-border/50 bg-secondary/30 p-5 space-y-2 hover:border-border transition-colors"
            >
              <span className="text-[10px] font-mono text-muted-foreground">
                {ed.dates}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{ed.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{ed.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
