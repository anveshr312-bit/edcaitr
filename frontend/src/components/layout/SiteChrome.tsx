'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, ArrowUpRight, Globe, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { createClient } from '../../lib/supabase/client';
import { EdcLogo } from '../ui/Primitives';
import { FooterParticleLogo } from '../ui/FooterParticleLogo';
import { GooeyNav, type GooeyNavItem } from '../ui/GooeyNav';
import { MinimalGridBackground } from '../ui/MinimalGridBackground';
import { ThemeToggleButton } from '../ui/ThemeToggle';
import { GooeySearch, type SearchResultItem } from '../ui/GooeySearch';
import { NotificationsDrawer } from '../ui/NotificationsDrawer';

const PUBLIC_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'EDC Anchors', href: '/team' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const DIRECTOR_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Dashboard', href: '/account/dashboard' },
  { label: 'Calendar', href: '/workspace/calendar' },
  { label: 'Applications', href: '/account/applications' },
  { label: 'Workspace', href: '/workspace' },
  { label: 'Alumni', href: '/alumni/directory' },
];

const ADVISOR_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Dashboard', href: '/account/dashboard' },
  { label: 'Calendar', href: '/workspace/calendar' },
  { label: 'Applications', href: '/account/applications' },
  { label: 'Workspace', href: '/workspace' },
  { label: 'Alumni', href: '/alumni/directory' },
];

const CORE_TEAM_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Workspace', href: '/workspace' },
  { label: 'Calendar', href: '/workspace/calendar' },
  { label: 'Events Desk', href: '/workspace/events' },
  { label: 'Alumni', href: '/alumni/directory' },
];

const ALUMNI_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Alumni Connect', href: '/alumni' },
  { label: 'Directory', href: '/alumni/directory' },
  { label: 'Opportunities', href: '/alumni/opportunities' },
  { label: 'Showcase', href: '/alumni/startups' },
];

const PARTICIPANT_NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'My Passes', href: '/portal/registrations' },
  { label: 'Certificates', href: '/portal/certificates' },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [role, setRole] = useState<string>('participant');
  const [fullName, setFullName] = useState<string>('');

  const isWorkspaceRoute = useMemo(() => {
    return (
      pathname.startsWith('/workspace') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/portal') ||
      pathname.startsWith('/alumni')
    );
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
          setRole(data.role ?? 'participant');
          setFullName(data.profile?.full_name ?? '');
        } else {
          setUser(null);
          setRole('participant');
        }
      } catch {
        // Fallback
      }
    };

    fetchMe();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchMe();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const isStaffUser = ['director', 'advisor', 'core_team', 'alumni'].includes(role);

  // Pick contextual nav items based on user role
  const activeNavItems = useMemo(() => {
    if (!user) return PUBLIC_NAV_ITEMS;

    if (role === 'director') return DIRECTOR_NAV_ITEMS;
    if (role === 'advisor') return ADVISOR_NAV_ITEMS;
    if (role === 'core_team') return CORE_TEAM_NAV_ITEMS;
    if (role === 'alumni') return ALUMNI_NAV_ITEMS;
    // Participants and guests browse the exact public website navigation
    return PUBLIC_NAV_ITEMS;
  }, [user, role]);

  const activeIndex = useMemo(() => {
    // 1. Exact match first
    const exact = activeNavItems.findIndex((item) => item.href === pathname);
    if (exact !== -1) return exact;

    // 2. Longest matching path prefix for nested routes
    let bestIdx = -1;
    let longestMatch = 0;
    activeNavItems.forEach((item, idx) => {
      if (item.href && item.href !== '/') {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
          if (item.href.length > longestMatch) {
            longestMatch = item.href.length;
            bestIdx = idx;
          }
        }
      }
    });

    if (bestIdx !== -1) return bestIdx;
    if (pathname === '/' && activeNavItems.some((i) => i.href === '/')) return 0;
    return 0;
  }, [activeNavItems, pathname]);

  const searchItems: SearchResultItem[] = [
    { id: '1', title: 'PitchBiz 5.0 Conclave', category: 'Events', url: '/events' },
    { id: '2', title: 'FOKUS X E-Summit 2026', category: 'Events', url: '/#summit-2026' },
    { id: '3', title: 'EDC Anchors & Leadership', category: 'Directory', url: '/team' },
    { id: '4', title: 'AIIH Incubation Hub', category: 'Incubation', url: '/about' },
    { id: '5', title: 'Alumni Founder Directory', category: 'Alumni', url: '/alumni/directory' },
    { id: '6', title: 'Kriyeta National Hackathon', category: 'Events', url: '/events' },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[var(--color-1-mood)] text-[var(--color-2-mood)] transition-colors duration-200">
      {/* Background canvas: Minimal, professional architectural grid with top ambient glow and vignette mask */}
      <MinimalGridBackground variant="grid" size={48} interactive />

      {/* Staff Public Website Awareness Banner */}
      {isStaffUser && !isWorkspaceRoute && (
        <div className="relative z-50 border-b border-[#C01E30]/20 bg-[#C01E30]/[0.08] px-4 py-1.5 text-center text-xs text-[#C01E30] dark:text-[#E67C87] flex items-center justify-center gap-2 font-medium">
          <span>Signed in as <strong className="capitalize">{role.replace('_', ' ')}</strong> · You are viewing the public website</span>
          <Link href="/workspace" className="inline-flex items-center gap-1 font-bold underline hover:opacity-80">
            <span>Return to Workspace Hub</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Unslopped Frosted Glass Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--surface)]/85 backdrop-blur-xl backdrop-saturate-150 shadow-xs transition-colors">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-6 md:h-[68px] md:flex-nowrap md:gap-4 md:py-0">
          {/* Logo */}
          <Link
            href="/"
            className="order-1 flex shrink-0 items-center rounded-lg focus-visible:outline-2"
            aria-label="EDC AITR Home"
          >
            <EdcLogo variant="auto" className="h-8 w-auto sm:h-9 md:h-10" />
          </Link>

          {/* Dynamic Contextual Navigation */}
          <nav
            aria-label="Main navigation"
            className="order-3 flex w-full items-center justify-center md:order-2 md:w-auto"
          >
            <GooeyNav
              items={activeNavItems}
              activeIndex={activeIndex}
              onChange={(_, item) => item.href && router.push(item.href)}
              theme={theme}
              color="#C01E30"
              activeTextColor="#ffffff"
              colors={
                theme === 'dark'
                  ? ['#C01E30', '#D4283B', '#9E1625']
                  : ['#C01E30', '#E11D48', '#9E1625']
              }
              size="sm"
              frame
              particleCount={12}
              spread={40}
              animationTime={500}
              timeVariance={200}
              gooeyness={0.5}
              wobble={0.4}
              hoverEffect
            />
          </nav>

          {/* Actions: Search, Notifications, Switcher & Profile */}
          <div className="order-2 flex shrink-0 items-center gap-2 sm:gap-3 md:order-3">
            {/* Gooey search input */}
            <div className="relative shrink-0 z-10">
              <GooeySearch
                items={searchItems}
                placeholder="Search..."
                buttonLabel="Search"
                onSelect={(item) => {
                  if (typeof item === 'object' && item.url) {
                    router.push(item.url);
                  }
                }}
              />
            </div>

            {/* Notification & Announcement Drawer */}
            <div className="relative shrink-0 z-20">
              <NotificationsDrawer />
            </div>

            {/* Public Website vs Workspace Switcher for Staff */}
            {isStaffUser && (
              <>
                {isWorkspaceRoute ? (
                  <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3 text-xs font-semibold text-foreground hover:bg-secondary hover:border-border transition-all"
                    title="View the public website"
                  >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Public Website</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </Link>
                ) : (
                  <Link
                    href="/workspace"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#C01E30]/40 bg-[#C01E30]/10 px-3 text-xs font-semibold text-[#C01E30] hover:bg-[#C01E30]/20 transition-all shadow-xs"
                    title="Switch to Workspace Hub"
                  >
                    <Zap className="h-3.5 w-3.5 fill-[#C01E30]" />
                    <span>Workspace Hub</span>
                  </Link>
                )}
              </>
            )}

            {/* Dashboard / Auth Button */}
            {user ? (
              <Link
                href="/account/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-secondary/80 px-3 text-xs font-semibold text-foreground hover:border-[#C01E30] hover:bg-secondary transition-colors"
                title={user.email ? `Signed in as ${user.email}` : 'My Account'}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="max-w-[80px] sm:max-w-[110px] truncate">
                  {fullName ? fullName.split(' ')[0] : 'Dashboard'}
                </span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="inline-flex h-9 items-center rounded-full bg-[#C01E30] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#a01828] transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggleButton variant="circle" start="top-right" blur={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-[68vh] flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 px-3 pb-5 sm:mt-28 sm:px-6 sm:pb-7">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-t-[34px] rounded-b-[20px] border border-white/[0.08] bg-[#121316] text-[#F4F5F7] dark:border-[#303032] dark:bg-[#171719] sm:rounded-t-[48px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-[0.07]"
          >
            <svg
              viewBox="0 0 1240 420"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-40 90 C 90 140, 140 280, 260 260 C 380 240, 410 70, 560 95 C 710 120, 740 310, 910 295 C 1060 282, 1140 120, 1290 165"
                stroke="white"
                strokeWidth="1.25"
              />
              <path
                d="M-60 210 C 60 170, 170 360, 320 340 C 470 320, 510 160, 680 185 C 850 210, 890 385, 1080 350 C 1180 332, 1230 240, 1300 250"
                stroke="white"
                strokeWidth="1.25"
              />
            </svg>
          </div>
          <div className="relative z-10 flex justify-center pt-8 pb-2 sm:pt-10 sm:pb-3">
            <Link href="/" aria-label="EDC AITR Home" className="rounded-2xl p-2 overflow-visible">
              <FooterParticleLogo className="h-auto w-20 sm:w-24" />
            </Link>
          </div>
          <div className="relative z-10 px-6 pb-9 sm:px-10 sm:pb-12 lg:px-14">
            <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-6">
              <div className="flex flex-col items-center text-center lg:order-2 lg:col-span-4">
                <h2 className="font-display text-3xl font-semibold leading-[1.04] tracking-tight text-white sm:text-[2.35rem]">
                  EDC AITR
                  <span className="mt-0.5 block text-2xl font-semibold text-white/90 sm:text-[1.85rem]">
                    Acropolis Indore
                  </span>
                </h2>
                <p className="mt-2.5 font-serif text-sm italic tracking-wide text-white/70 sm:text-[15px]">
                  Where student founders take flight
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2.5 rounded-full bg-[#C01E30] py-2 pl-4 pr-2 text-xs font-semibold text-white hover:bg-[#9E1625]"
                  >
                    Explore Events
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
              <div className="space-y-6 lg:order-1 lg:col-span-4">
                <div className="grid grid-cols-2 items-start gap-4">
                  <div className="space-y-2">
                    <h3 className="font-display text-base font-semibold text-white">Contact</h3>
                    <div className="space-y-0.5 text-xs leading-relaxed text-white/70">
                      <p>Bypass Road, Manglia Square,</p>
                      <p>Indore, MP 453771</p>
                      <p className="pt-1">
                        <a
                          href="mailto:edc@acropolis.in"
                          className="text-white/90 underline underline-offset-4 hover:text-[#F87171]"
                        >
                          edc@acropolis.in
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 text-xs sm:pt-7">
                    <a
                      href="https://instagram.com/edc_acropolis"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-white/80 hover:text-white"
                    >
                      Instagram <ArrowUpRight className="h-3.5 w-3.5 text-[#E11D48]" />
                    </a>
                    <Link
                      href="/#summit-2026"
                      className="flex items-center gap-1.5 text-white/80 hover:text-white"
                    >
                      E-Summit 2026 <ArrowUpRight className="h-3.5 w-3.5 text-[#E11D48]" />
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/65">
                  <span className="rounded-full bg-[#C01E30] px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                    AIIH
                  </span>
                  <span>Backed by AIIH Foundation · IIC (MoE Innovation Cell)</span>
                </div>
              </div>
              <div className="flex flex-col justify-between space-y-6 lg:order-3 lg:col-span-4 lg:items-end">
                <div className="w-full space-y-2.5 lg:max-w-[290px]">
                  <h3 className="font-display text-base font-semibold text-white">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-white/75">
                    <Link href="/">Home</Link>
                    <Link href="/events">Live Events</Link>
                    <Link href="/about">About EDC</Link>
                    <Link href="/portal">Participant Portal</Link>
                    <Link href="/team">EDC Anchors</Link>
                    <Link href="/alumni/directory">Alumni Connect</Link>
                  </div>
                </div>
                <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 self-start rounded-lg bg-[#F4F5F7] px-3.5 py-2 text-[11px] font-medium text-[#111318] dark:border dark:border-[#303032] dark:bg-[#202022] dark:text-[#F1F0ED] lg:self-end">
                  <Link href="/contact">Contact</Link>
                  <Link href="/workspace">Workspace</Link>
                  <span className="font-mono text-[#343435] dark:text-[#A4A4A8]">©2026 EDC AITR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
