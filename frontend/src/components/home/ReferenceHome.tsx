'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Camera, Cloud, Cpu, Handshake, MapPin, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useMotionSystem } from '../../context/MotionContext';
import {
  DRIFT_WALL_TILES,
  EDITORIAL_IMAGES,
  IMPACT_METRICS,
  INITIATIVES,
  MARQUEE_GUESTS,
  PARTNER_ORGANIZATIONS,
  type Guest,
} from '../../data/seedData';
import type { PublicEvent } from '../../lib/events/events';
import { AccordionGallery } from '../ui/AccordionGallery';
import { AnimatedContent } from '../ui/AnimatedContent';
import { DriftWall } from '../ui/DriftWall';
import { GuestCoverflow } from '../ui/GuestCoverflow';
import { KineticHeading } from '../ui/KineticHeading';
import { LiquidButton } from '../ui/LiquidButton';
import { LogoLoop, type LogoNodeItem } from '../ui/LogoLoop';
import { RollingStat } from '../ui/RollingStat';

function formatEventDate(value: string | null) {
  if (!value) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export default function ReferenceHome({ events }: { events: PublicEvent[] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { reducedMotion } = useMotionSystem();
  const [activeInitiativeIndex, setActiveInitiativeIndex] = useState(0);
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth >= 1024) return 'desktop';
    if (window.innerWidth >= 640) return 'tablet';
    return 'mobile';
  });
  const fokusEvent = events.find((event) => event.slug === 'fokus-x-e-summit-2026');
  const activeInitiative = INITIATIVES[activeInitiativeIndex] ?? INITIATIVES[0];

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const tablet = window.matchMedia('(min-width: 640px)');
    const sync = () => setViewport(desktop.matches ? 'desktop' : tablet.matches ? 'tablet' : 'mobile');
    sync();
    desktop.addEventListener('change', sync);
    tablet.addEventListener('change', sync);
    return () => {
      desktop.removeEventListener('change', sync);
      tablet.removeEventListener('change', sync);
    };
  }, []);

  const partnerLogos: LogoNodeItem[] = useMemo(
    () =>
      PARTNER_ORGANIZATIONS.map((partner) => ({
        title: partner.name,
        ariaLabel: `${partner.name} — ${partner.role}`,
        hoverColor: '#C01E30',
        node: (
          <div className="border-l border-[var(--border-hairline)] py-1.5 pl-6 pr-2 text-left">
            <p className="font-display whitespace-nowrap text-base font-semibold tracking-[-0.015em] text-[var(--color-2-mood)]">
              {partner.name}
            </p>
            <p className="mt-1 whitespace-nowrap text-xs text-[var(--ink-muted)]">{partner.role}</p>
          </div>
        ),
      })),
    []
  );

  const galleryItems = useMemo(
    () =>
      INITIATIVES.slice(0, 5).map((item) => ({
        image: item.image,
        label: item.title,
        subtitle: item.cadence,
        code: item.code,
        link: `/events/${item.linkedSlug}`,
        alt: `${item.title} — EDC AITR`,
      })),
    []
  );

  const guests = MARQUEE_GUESTS as Guest[];
  const wall = viewport === 'mobile'
    ? { columns: 3, tileWidth: 148, tileHeight: 100, gap: 12, radius: 7, tilt: 6, turn: -4, perspective: 1000, depth: 40, speed: 15, variance: 0.25, parallax: 0, lift: 24, fade: 0.4, dim: isDark ? 0.22 : 0.18 }
    : viewport === 'tablet'
      ? { columns: 4, tileWidth: 192, tileHeight: 128, gap: 16, radius: 8, tilt: 10, turn: -8, perspective: 1200, depth: 68, speed: 18, variance: 0.32, parallax: 0.26, lift: 32, fade: 0.36, dim: isDark ? 0.18 : 0.14 }
      : { columns: 6, tileWidth: 214, tileHeight: 142, gap: 18, radius: 8, tilt: 13, turn: -11, perspective: 1300, depth: 90, speed: 20, variance: 0.35, parallax: 0.36, lift: 40, fade: 0.32, dim: isDark ? 0.14 : 0.1 };

  return (
    <div className="w-full">
      <section className="relative isolate overflow-hidden border-b border-[var(--border-hairline)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.45) 4%, black 10%, black 90%, rgba(0,0,0,.45) 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.45) 4%, black 10%, black 90%, rgba(0,0,0,.45) 96%, transparent 100%)',
          }}
        >
          <DriftWall
            items={DRIFT_WALL_TILES}
            {...wall}
            direction="up"
            overlayColor={isDark ? '#101011' : '#fafafc'}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 46% 58% at 50% 47%, rgba(16,16,17,.96) 0%, rgba(16,16,17,.88) 42%, rgba(16,16,17,.52) 68%, rgba(16,16,17,.08) 100%)'
              : 'radial-gradient(ellipse 46% 58% at 50% 47%, rgba(250,250,252,.97) 0%, rgba(250,250,252,.91) 42%, rgba(250,250,252,.56) 68%, rgba(250,250,252,.06) 100%)',
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
          <div className="inline-flex items-center gap-2.5 text-xs font-medium tracking-[0.02em] text-[var(--ink-secondary)] sm:text-[13px]">
            <span aria-hidden="true" className="hidden h-px w-5 bg-[#C01E30]/65 sm:inline-block" />
            <span>Entrepreneurship Development Cell</span>
            <span aria-hidden="true" className="text-[#C01E30]">·</span>
            <span>Acropolis Indore</span>
            <span aria-hidden="true" className="hidden h-px w-5 bg-[#C01E30]/65 sm:inline-block" />
          </div>
          <div className="mt-5 w-full max-w-[1060px] text-[clamp(2.35rem,4.9vw,4.35rem)] sm:mt-6">
            <KineticHeading
              as="h1"
              text="Empowering the Next Wave of"
              accentText="Student Founders"
              breakBeforeAccent="md"
              replayKey="home-hero-headline"
              immediate
              className="font-display text-[var(--color-2-mood)] font-bold leading-[1.03] tracking-[-0.03em]"
              accentClassName="text-[#C01E30] dark:text-[#D93848]"
            />
          </div>
          <p className="mx-auto mt-5 max-w-[56ch] text-base leading-[1.65] text-[var(--ink-secondary)] sm:mt-6 sm:text-[1.0625rem]">
            Operating in partnership with the <strong className="font-semibold text-[var(--color-2-mood)]">AIIH Foundation</strong> (Acropolis Institutional Incubation Hub), EDC AITR guides student builders from first hardware prototype to DPIIT recognition, pre-incubation grants, and angel investment across Central India.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5 sm:mt-8">
            <LiquidButton variant="crimson-solid" onClick={() => router.push('/events')}>
              <span>Explore Live Events</span><ArrowRight className="h-4 w-4" />
            </LiquidButton>
            <LiquidButton variant="outline" onClick={() => router.push('/account')}>
              <span>Sign In to Portal</span>
            </LiquidButton>
          </div>
          <div className="mt-7 flex w-full max-w-xl flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 border-t border-[var(--border-strong)]/70 pt-5 text-xs font-medium text-[var(--ink-secondary)] sm:mt-8 sm:text-[13px]">
            <span>Manglia Square, Indore</span><span aria-hidden="true" className="text-[#C01E30]/75">·</span>
            <span>Backed by AIIH Foundation</span><span aria-hidden="true" className="text-[#C01E30]/75">·</span>
            <span>IIC (MoE Innovation Cell) Affiliated</span>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border-hairline)] bg-[var(--surface)] dark:bg-[#151517]">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4">
            <p className="font-mono-data text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848]">
              {fokusEvent?.status === 'closed' || fokusEvent?.status === 'archived' ? 'Flagship Conclave / Archive · 2026' : 'Flagship Conclave / 2026'}
            </p>
            <p className="font-mono-data text-[11px] tracking-[0.06em] text-[var(--ink-muted)]">EDC AITR · Acropolis Indore</p>
          </div>
          <div className="grid grid-cols-1 items-start gap-8 pt-7 sm:pt-9 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <h2 className="m-0">
                <span className="font-display block text-[clamp(2.5rem,4.6vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.035em] text-[var(--color-2-mood)]">FOKUS <span className="text-[#C01E30] dark:text-[#D93848]">X</span></span>
                <span className="mt-2.5 block font-display text-lg font-medium tracking-[-0.015em] text-[var(--ink-secondary)] sm:text-xl lg:text-[1.375rem]">E-Summit 2026</span>
              </h2>
              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--border-hairline)] pt-5 sm:mt-8 sm:grid-cols-2 sm:gap-6">
                <div><dt className="font-mono-data text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Schedule</dt><dd className="mt-1 text-sm font-medium text-[var(--color-2-mood)] sm:text-[15px]">{fokusEvent?.starts_at ? formatEventDate(fokusEvent.starts_at) : '18th–20th March 2026'}</dd></div>
                <div><dt className="font-mono-data text-[11px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Venue</dt><dd className="mt-1 text-sm font-medium text-[var(--color-2-mood)] sm:text-[15px]">{fokusEvent?.venue || 'AITR Main Auditorium, Indore'}</dd></div>
              </dl>
            </div>
            <div className="flex flex-col justify-between lg:col-span-6 lg:border-l lg:border-[var(--border-hairline)] lg:pl-10 xl:pl-12">
              <p className="max-w-[52ch] text-base leading-[1.7] text-[var(--ink-secondary)] sm:text-[1.0625rem]">Three days of keynote firesides, PitchBiz live investor evaluations, startup expo pavilions, and operator workshops at AITR Main Auditorium, Indore.</p>
              <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-8">
                <LiquidButton variant="obsidian" onClick={() => router.push(fokusEvent ? `/events/${fokusEvent.slug}` : '/events')}>
                  <span>View Summit Details</span><ArrowUpRight className="h-4 w-4" />
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-hairline)] pb-6 sm:pb-8 md:flex-row md:items-end">
          <div><p className="font-mono-data mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848] sm:text-xs">Institutional Track Record</p><h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-2-mood)]">Numbers That We Hit</h2></div>
          <p className="max-w-[44ch] text-sm leading-relaxed text-[var(--ink-secondary)] sm:text-[15px]">Audited ecosystem outcomes across Acropolis Indore, AIIH Foundation cohorts, and state-backed innovation pipelines.</p>
        </div>
        <AnimatedContent distance={36} duration={0.7} threshold={0.1}>
          <div className="border-b border-[var(--border-hairline)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="flex flex-col justify-between border-b border-[var(--border-hairline)] bg-[var(--surface)] px-5 py-8 dark:bg-[#171719] sm:px-8 sm:py-10 lg:col-span-6 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
                <div className="flex items-center justify-between gap-3"><span className="font-mono-data text-[11px] font-medium tracking-[0.12em] text-[#C01E30] dark:text-[#D93848]">01</span><span aria-hidden="true" className="h-px max-w-12 flex-1 bg-[#C01E30]/35" /></div>
                <div className="mt-6 sm:mt-8"><p className="whitespace-nowrap text-[clamp(3.1rem,5.2vw,4.65rem)] leading-[0.98] text-[#C01E30] dark:text-[#D93848]"><RollingStat value={IMPACT_METRICS[0].value} editorial replayOnHover={false} /></p><p className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--color-2-mood)] sm:mt-5 sm:text-xl">{IMPACT_METRICS[0].label}</p><p className="mt-2 max-w-[38ch] text-sm leading-[1.6] text-[var(--ink-secondary)] sm:text-[15px]">{IMPACT_METRICS[0].detail}</p></div>
              </div>
              <div className="grid grid-cols-1 divide-y divide-[var(--border-hairline)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-6 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
                {IMPACT_METRICS.slice(1, 3).map((metric, index) => <div key={metric.label} className="flex flex-col justify-center px-5 py-7 sm:px-7 sm:py-8 lg:px-10 lg:py-9"><span className="font-mono-data text-[11px] font-medium tracking-[0.12em] text-[var(--ink-muted)]">0{index + 2}</span><p className="mt-3 whitespace-nowrap text-[clamp(2.25rem,3.3vw,3.05rem)] leading-[1.02] text-[var(--color-2-mood)]"><RollingStat value={metric.value} editorial replayOnHover={false} delay={0.08 + index * 0.06} /></p><p className="mt-2.5 text-base font-semibold text-[var(--color-2-mood)]">{metric.label}</p><p className="mt-1.5 max-w-[44ch] text-sm leading-[1.58] text-[var(--ink-secondary)]">{metric.detail}</p></div>)}
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {IMPACT_METRICS.slice(3).map((metric, index) => <div key={metric.label} className="flex flex-col justify-between px-5 py-7 sm:px-6 sm:py-8 lg:px-8"><div><span className="font-mono-data text-[11px] font-medium tracking-[0.12em] text-[var(--ink-muted)]">0{index + 4}</span><p className="mt-3 whitespace-nowrap text-[clamp(1.75rem,2.3vw,2.25rem)] leading-[1.06] text-[var(--color-2-mood)]"><RollingStat value={metric.value} editorial replayOnHover={false} delay={0.18 + index * 0.05} /></p><p className="mt-2.5 text-sm font-semibold text-[var(--color-2-mood)] sm:text-[15px]">{metric.label}</p></div><p className="mt-2 max-w-[34ch] text-xs leading-[1.6] text-[var(--ink-muted)] sm:text-[13px]">{metric.detail}</p></div>)}
            </div>
          </div>
        </AnimatedContent>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-20 lg:pb-24">
        <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[var(--border-hairline)] pb-6 sm:mb-8 sm:flex-row sm:items-end sm:pb-8">
          <div><p className="font-mono-data mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848] sm:text-xs">Year-Round Programs</p><h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-2-mood)]">Our Initiatives</h2></div>
          <Link href="/events" className="inline-flex items-center gap-1.5 self-start whitespace-nowrap text-sm font-medium text-[var(--color-2-mood)] transition-colors hover:text-[#C01E30] sm:self-auto">View Full Event Calendar <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <AnimatedContent distance={36} duration={0.7} threshold={0.1}>
          <AccordionGallery items={galleryItems} defaultIndex={0} orientation={viewport === 'mobile' ? 'vertical' : 'horizontal'} accentColor="#C01E30" overlayColor="#101011" height={viewport === 'mobile' ? 540 : viewport === 'tablet' ? 390 : 440} gap={viewport === 'mobile' ? 8 : 10} radius={8} expandRatio={viewport === 'mobile' ? 0.44 : 0.52} parallax={0.3} trigger={viewport === 'mobile' ? 'click' : 'hover'} grayscale inactiveGrayscale={0.32} inactiveDim={0.28} onActiveChange={setActiveInitiativeIndex} />
          {activeInitiative && <div aria-live="polite" className="mt-6 grid grid-cols-1 items-start gap-5 border-y border-[var(--border-hairline)] py-6 sm:mt-7 sm:py-7 lg:grid-cols-12 lg:items-center lg:gap-8"><div className="lg:col-span-9"><div className="flex flex-wrap items-center gap-2.5 text-xs"><span className="font-mono-data font-medium uppercase tracking-[0.12em] text-[#C01E30] dark:text-[#D93848]">{String(activeInitiativeIndex + 1).padStart(2, '0')} · {activeInitiative.code}</span><span aria-hidden="true" className="text-[var(--border-strong)]">/</span><span className="font-mono-data text-[11px] text-[var(--ink-muted)]">{activeInitiative.cadence}</span></div><h3 className="font-display mt-2 text-xl font-bold tracking-[-0.02em] text-[var(--color-2-mood)] sm:text-2xl">{activeInitiative.title}</h3><p className="mt-2 max-w-[64ch] text-sm leading-[1.65] text-[var(--ink-secondary)] sm:text-[15px]">{activeInitiative.summary}</p></div><div className="flex lg:col-span-3 lg:justify-end"><Link href={`/events/${activeInitiative.linkedSlug}`} className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-2-mood)] hover:border-[#C01E30]">Inspect Program <ArrowUpRight className="h-3.5 w-3.5" /></Link></div></div>}
        </AnimatedContent>
      </section>

      <section className="border-y border-[var(--border-hairline)] bg-[var(--surface)] dark:bg-[#151517]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
          <div className="flex flex-col lg:col-span-5"><div className="min-h-[280px] flex-1 overflow-hidden rounded-[6px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] sm:min-h-[340px] lg:min-h-[450px]"><img src={EDITORIAL_IMAGES.csiFablab} alt="AIIH Foundation and CSI hardware prototyping FabLab" className="h-full w-full object-cover" loading="lazy" /></div><p className="font-mono-data mt-3 text-[11px] tracking-[0.06em] text-[var(--ink-muted)]">AIIH Foundation Prototyping Lab · Acropolis Indore</p></div>
          <div className="flex flex-col justify-between lg:col-span-7"><div><div className="flex flex-wrap items-center gap-2.5 text-xs"><span className="font-mono-data text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848] sm:text-xs">CSI · 8-Month Cohort</span><span aria-hidden="true" className="text-[var(--border-strong)]">/</span><span className="font-mono-data text-[11px] text-[var(--ink-muted)]">AIIH Foundation Pre-Incubation</span></div><h2 className="font-display mt-3 text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-2-mood)]">Campus Startup Initiative (CSI)</h2><p className="mt-4 max-w-[56ch] text-base leading-[1.68] text-[var(--ink-secondary)] sm:text-[1.0625rem]">Structured venture pre-incubation taking student ideas from lab bench to incorporation, DPIIT registration, and investor demo day without taking founder equity at entry.</p></div>
            <div className="mt-8 grid grid-cols-1 divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)] pt-7 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[{ icon: Cpu, title: 'Prototyping FabLabs', body: 'Direct access to 3D printers, PCB workbenches, and IoT testing bays inside AIIH.' }, { icon: Cloud, title: 'Cloud Credits', body: 'Verified startup sandboxes via AWS Activate and Google Cloud for Startups.' }, { icon: Users, title: '1-on-1 Mentorship', body: 'Bi-weekly founder clinics with TiE MP operators, IP attorneys, and alumni CTOs.' }].map(({ icon: Icon, title, body }, i) => <div key={title} className={`py-5 sm:py-0 ${i === 0 ? 'sm:pr-6' : i === 1 ? 'sm:px-6' : 'sm:pl-6'}`}><div className="flex items-center justify-between gap-2"><span className="font-mono-data text-[11px] text-[var(--ink-muted)]">0{i + 1}</span><Icon className="h-4 w-4 text-[#C01E30] dark:text-[#D93848]" strokeWidth={1.75} /></div><h3 className="font-display mt-3 text-sm font-semibold text-[var(--color-2-mood)] sm:text-[15px]">{title}</h3><p className="mt-1.5 text-xs leading-[1.6] text-[var(--ink-secondary)] sm:text-[13px]">{body}</p></div>)}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3.5 border-t border-[var(--border-hairline)] pt-6"><Link href="/contact?tab=csi" className="rounded-full bg-[#C01E30] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9E1625]">Apply for CSI Pre-Incubation</Link><Link href="/about" className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-[var(--color-2-mood)] hover:border-[#C01E30]">Read AIIH Incubation Pipeline</Link></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[var(--border-hairline)] pb-6 sm:flex-row sm:items-end sm:pb-8"><div><p className="font-mono-data mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848] sm:text-xs">Speaker Archive</p><h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-2-mood)]">Guests We Hosted</h2></div><p className="text-xs text-[var(--ink-muted)] sm:text-[13px]">Drag, click, or use arrow keys to explore past keynote speakers</p></div>
        <AnimatedContent distance={32} duration={0.7} threshold={0.1}><GuestCoverflow guests={guests} /></AnimatedContent>
      </section>

      <section className="mb-12 border-y border-[var(--border-hairline)] bg-[var(--surface)]/55 dark:bg-[#141416] sm:mb-16">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-3 border-b border-[var(--border-hairline)] pb-6 sm:flex-row sm:items-end"><div><p className="font-mono-data mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848] sm:text-xs">Institutional &amp; Investor Backing</p><h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--color-2-mood)]">Organisations That Back Us</h2></div>{!reducedMotion && <p className="text-xs text-[var(--ink-muted)]">Hover to pause · Drag to explore ecosystem partners</p>}</div>
          <AnimatedContent distance={28} duration={0.65} threshold={0.1}>{reducedMotion ? <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">{PARTNER_ORGANIZATIONS.map((partner) => <div key={partner.name} className="border-l border-[var(--border-hairline)] py-1 pl-5"><p className="font-display text-base font-semibold tracking-[-0.015em] text-[var(--color-2-mood)]">{partner.name}</p><p className="mt-1 text-xs text-[var(--ink-secondary)]">{partner.role}</p></div>)}</div> : <LogoLoop logos={partnerLogos} speed={30} gap={44} logoHeight={56} hoverSpeed={0} fadeOut fadeOutWidth={0.1} scaleOnHover={false} draggable ariaLabel="Institutional and investor partner organizations" />}</AnimatedContent>
        </div>
      </section>

      {events.length > 0 && <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-4"><div><p className="font-mono-data mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#D93848]">Live from the database</p><h2 className="font-display text-2xl font-bold text-[var(--color-2-mood)] sm:text-3xl">Events &amp; Registration</h2></div><Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-2-mood)] hover:text-[#C01E30]">All events <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <article key={event.id} className="flex flex-col border-t border-[var(--border-strong)] bg-[var(--surface)] p-5"><div className="flex items-center justify-between gap-3"><span className="font-mono-data text-[10px] uppercase tracking-[0.12em] text-[#C01E30]">{event.status.replace('_', ' ')}</span><span className="font-mono-data text-xs text-[var(--ink-muted)]">{event.is_paid && event.fee_amount ? `₹${event.fee_amount}` : 'Free'}</span></div><h3 className="font-display mt-4 text-xl font-bold text-[var(--color-2-mood)]">{event.title}</h3>{event.summary && <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">{event.summary}</p>}<p className="font-mono-data mt-4 text-[11px] text-[var(--ink-muted)]">{formatEventDate(event.starts_at)}{event.venue ? ` · ${event.venue}` : ''}</p><Link href={`/events/${event.slug}`} className="mt-5 inline-flex items-center gap-2 self-start text-sm font-semibold text-[#C01E30] hover:underline">Open &amp; Register <ArrowUpRight className="h-4 w-4" /></Link></article>)}</div>
      </section>}

      <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
        <AnimatedContent distance={48} duration={0.75} threshold={0.1}>
          <div className="studio-card p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-hairline)] pb-6 md:flex-row md:items-end"><div><p className="mb-1.5 text-xs font-medium text-[#C01E30] dark:text-[#F87171]">Direct Institutional Intake</p><h2 className="font-display text-2xl font-semibold text-[var(--color-2-mood)] sm:text-3xl">Reach Out to Us</h2></div><a href="https://instagram.com/edc_acropolis" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-[9px] border border-[var(--border-strong)] px-3.5 py-2 text-sm font-medium text-[var(--color-2-mood)] hover:border-[#C01E30] hover:text-[#C01E30] md:self-auto"><Camera className="h-4 w-4" />@edc_acropolis<ArrowUpRight className="h-3.5 w-3.5" /></a></div>
            <div className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-3">
              {[{ num: '01', tag: 'Founders', title: 'Student Founders', body: 'Pitch for CSI Cohort 06 pre-incubation, AIIH prototyping fablab hours, or DPIIT and NIDHI-EIR grant guidance.', action: 'Submit Startup Brief', href: '/contact?tab=csi' }, { num: '02', tag: 'Partners', title: 'Corporate Sponsors & VCs', body: 'Partner with FOKUS X E-Summit 2026, judge PitchBiz Investment Arena, or sponsor Kriyeta hackathon tracks.', action: 'Request Partnership Deck', href: '/contact?tab=sponsorship' }, { num: '03', tag: 'Recruitment', title: 'Student Team Applicants', body: 'Join one of the 12 operational divisions powering Acropolis Indore’s flagship entrepreneurship events.', action: 'Apply to Join EDC', href: '/account/apply' }].map((item, index) => <div key={item.num} className={`flex flex-col justify-between space-y-3 ${index > 0 ? 'md:border-l md:border-[var(--border-hairline)] md:pl-6' : ''}`}><div><p className="font-mono-data text-xs text-[var(--ink-muted)]">{item.num} · {item.tag}</p><h3 className="font-display mt-1.5 text-base font-semibold text-[var(--color-2-mood)]">{item.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">{item.body}</p></div><Link href={item.href} className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--color-2-mood)] hover:border-[#C01E30]">{item.action}<ArrowRight className="h-3.5 w-3.5" /></Link></div>)}
            </div>
            <div className="font-mono-data mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-hairline)] pt-5 text-xs text-[var(--ink-muted)]"><MapPin className="h-3.5 w-3.5 text-[#C01E30]" /><span>Acropolis Institute of Technology &amp; Research, Manglia Square, Indore</span><Handshake className="ml-1 h-3.5 w-3.5 text-[#C01E30]" /><span>Backed by AIIH Foundation</span></div>
          </div>
        </AnimatedContent>
      </section>
    </div>
  );
}
