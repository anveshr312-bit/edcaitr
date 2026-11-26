'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { createClient } from '../../lib/supabase/client';
import { EdcLogo } from '../ui/Primitives';
import { EdcMark } from '../ui/EdcMark';
import { GooeyNav, type GooeyNavItem } from '../ui/GooeyNav';
import { WaveGridBackground } from '../ui/WaveGridBackground';
import { ThemeToggleButton } from '../ui/ThemeToggle';
import { AppCommandPaletteTrigger } from '../ui/AppCommandPalette';

const NAV_ITEMS: GooeyNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Events', href: '/events' },
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/team' },
  { label: 'Contact', href: '/contact' },
];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const activeIndex = Math.max(0, NAV_ITEMS.findIndex(({ href }) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
  ));

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[var(--color-1-mood)] text-[var(--color-2-mood)] transition-colors duration-200">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50 dark:opacity-40" aria-hidden="true">
        <WaveGridBackground
          gridSize={40}
          colorBase={isDark ? "#121316" : "#f0f0f2"}
          colorHigh="#C01E30"
          waveAmplitude={0.4}
          waveSpeed={6.0}
          waveFrequency={1.2}
          waveWidth={3.0}
          waveMaxHeight={0.4}
          autoAnimate
          vignette
        />
      </div>
      <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-white/90 backdrop-blur-md dark:bg-[#101011]/95">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-3 gap-y-2.5 px-3 py-2.5 sm:px-6 md:h-[70px] md:flex-nowrap md:gap-6 md:py-0">
          <Link
            href="/"
            className="order-1 flex shrink-0 items-center rounded-[6px] focus-visible:outline-2"
            aria-label="EDC AITR Home"
          >
            <EdcLogo variant="auto" className="h-8 w-auto sm:h-10 md:h-11" />
          </Link>
          <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-center md:order-2 md:w-auto">
            <GooeyNav
              items={NAV_ITEMS}
              activeIndex={activeIndex}
              onChange={(_, item) => item.href && router.push(item.href)}
              theme={theme}
              color="#C01E30"
              activeTextColor="#ffffff"
              colors={theme === 'dark' ? ['#C01E30', '#D4283B', '#9E1625'] : ['#C01E30', '#E11D48', '#9E1625']}
              size="sm"
              frame
              particleCount={14}
              spread={46}
              animationTime={540}
              timeVariance={240}
              gooeyness={0.5}
              wobble={0.45}
              hoverEffect
            />
          </nav>
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:order-3">
            <AppCommandPaletteTrigger />
            {user ? (
              <Link
                href="/account/dashboard"
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3.5 text-xs font-semibold text-[var(--color-2-mood)] transition-colors hover:border-[#C01E30] hover:bg-[#C01E30]/10 sm:min-h-10 sm:px-4"
                title={user.email ? `Signed in as ${user.email}` : 'My Account'}
              >
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/account"
                className="inline-flex min-h-9 items-center rounded-full bg-[#BD011F] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625] sm:min-h-10 sm:px-5"
              >
                Sign In
              </Link>
            )}
            <ThemeToggleButton variant="circle" start="top-right" blur={false} />
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[68vh] flex-1">{children}</main>

      <footer className="relative z-10 mt-24 px-3 pb-5 sm:mt-28 sm:px-6 sm:pb-7">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-t-[34px] rounded-b-[20px] border border-white/[0.08] bg-[#121316] text-[#F4F5F7] dark:border-[#303032] dark:bg-[#171719] sm:rounded-t-[48px]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-[0.07]">
            <svg viewBox="0 0 1240 420" fill="none" preserveAspectRatio="xMidYMid slice" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M-40 90 C 90 140, 140 280, 260 260 C 380 240, 410 70, 560 95 C 710 120, 740 310, 910 295 C 1060 282, 1140 120, 1290 165" stroke="white" strokeWidth="1.25" />
              <path d="M-60 210 C 60 170, 170 360, 320 340 C 470 320, 510 160, 680 185 C 850 210, 890 385, 1080 350 C 1180 332, 1230 240, 1300 250" stroke="white" strokeWidth="1.25" />
              <path d="M120 -20 C 180 95, 290 125, 340 45 C 390 -35, 520 -10, 575 75 C 630 160, 780 135, 860 40 C 930 -45, 1080 35, 1130 140" stroke="white" strokeWidth="1.1" />
              <path d="M-30 330 C 110 300, 180 410, 310 390 C 440 370, 530 265, 675 305 C 820 345, 920 430, 1090 395" stroke="white" strokeWidth="1.1" />
            </svg>
          </div>
          <div className="relative z-10 flex justify-center pt-8 pb-2 sm:pt-10 sm:pb-3">
            <Link href="/" aria-label="EDC AITR Home" className="rounded-2xl p-2 transition-transform hover:scale-[1.04]">
              <EdcMark className="h-auto w-20 sm:w-24 text-[#C01E30]" />
            </Link>
          </div>
          <div className="relative z-10 px-6 pb-9 sm:px-10 sm:pb-12 lg:px-14">
            <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-6">
              <div className="flex flex-col items-center text-center lg:order-2 lg:col-span-4">
                <h2 className="font-display text-3xl font-semibold leading-[1.04] tracking-tight text-white sm:text-[2.35rem]">
                  EDC AITR<span className="mt-0.5 block text-2xl font-semibold text-white/90 sm:text-[1.85rem]">Acropolis Indore</span>
                </h2>
                <p className="mt-2.5 font-serif text-sm italic tracking-wide text-white/70 sm:text-[15px]">Where student founders take flight</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                  <Link href="/events" className="inline-flex items-center gap-2.5 rounded-full bg-[#BD011F] py-2 pl-4 pr-2 text-xs font-semibold text-white hover:bg-[#9E1625]">Explore Events<span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/25"><ArrowRight className="h-3.5 w-3.5" /></span></Link>
                  <Link href="/account/apply" className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] py-2 pl-4 pr-2 text-xs font-semibold text-white hover:bg-white/[0.11]">Join EDC Cell<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#BD011F] text-white"><ArrowRight className="h-3.5 w-3.5" /></span></Link>
                </div>
              </div>
              <div className="space-y-6 lg:order-1 lg:col-span-4">
                <div className="grid grid-cols-2 items-start gap-4">
                  <div className="space-y-2"><h3 className="font-display text-base font-semibold text-white">Contact</h3><div className="space-y-0.5 text-xs leading-relaxed text-white/70"><p>Bypass Road, Manglia Square,</p><p>Indore, MP 453771</p><p className="pt-1"><a href="mailto:edc@acropolis.in" className="text-white/90 underline underline-offset-4 hover:text-[#F87171]">edc@acropolis.in</a></p></div></div>
                  <div className="space-y-1.5 pt-1 text-xs sm:pt-7"><a href="https://instagram.com/edc_acropolis" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-white/80 hover:text-white">Instagram <ArrowUpRight className="h-3.5 w-3.5 text-[#E11D48]" /></a><Link href="/#summit-2026" className="flex items-center gap-1.5 text-white/80 hover:text-white">E-Summit 2026 <ArrowUpRight className="h-3.5 w-3.5 text-[#E11D48]" /></Link></div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/65"><span className="rounded-full bg-[#BD011F] px-2 py-0.5 font-mono-data text-[10px] font-semibold text-white">AIIH</span><span>Backed by AIIH Foundation · IIC (MoE Innovation Cell)</span></div>
              </div>
              <div className="flex flex-col justify-between space-y-6 lg:order-3 lg:col-span-4 lg:items-end">
                <div className="w-full space-y-2.5 lg:max-w-[290px]"><h3 className="font-display text-base font-semibold text-white">Quick Links</h3><div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-white/75"><Link href="/">Home</Link><Link href="/events">Live Events</Link><Link href="/about">About EDC</Link><Link href="/portal">Participant Portal</Link><Link href="/team">Team Directory</Link><Link href="/alumni/directory">Alumni Connect</Link></div></div>
                <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 self-start rounded-[8px] bg-[#F4F5F7] px-3.5 py-2 text-[11px] font-medium text-[#111318] dark:border dark:border-[#303032] dark:bg-[#202022] dark:text-[#F1F0ED] lg:self-end"><Link href="/contact">Contact</Link><Link href="/workspace">Workspace</Link><span className="font-mono-data text-[#343435] dark:text-[#A4A4A8]">©2026 EDC AITR</span></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
