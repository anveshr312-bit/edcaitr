'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { DRIFT_WALL_TILES } from '../../data/seedData';
import { useTheme } from '../../context/ThemeContext';
import dynamic from 'next/dynamic';
import { useMotionSystem } from '../../context/MotionContext';
const DriftWall = dynamic(() => import('../ui/DriftWall').then(module => module.DriftWall), { ssr: false });
import { KineticHeading } from '../ui/KineticHeading';
import { LiquidButton } from '../ui/LiquidButton';

function getCurrentViewport(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth >= 1024) return 'desktop';
  if (window.innerWidth >= 640) return 'tablet';
  return 'mobile';
}

export function useHomeViewport() {
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(getCurrentViewport);
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
  return viewport;
}

export function HomeHeroDrift() {
  const viewport = useHomeViewport();
  const { isDark } = useTheme();
  const router = useRouter();
  const { introReady } = useMotionSystem();
  const wall = viewport === 'mobile'
    ? { columns: 3, tileWidth: 148, tileHeight: 100, gap: 12, radius: 7, tilt: 6, turn: -4, perspective: 1000, depth: 40, speed: 15, variance: 0.25, parallax: 0, lift: 24, fade: 0.4, dim: isDark ? 0.22 : 0.18 }
    : viewport === 'tablet'
      ? { columns: 4, tileWidth: 192, tileHeight: 128, gap: 16, radius: 8, tilt: 10, turn: -8, perspective: 1200, depth: 68, speed: 18, variance: 0.32, parallax: 0.26, lift: 32, fade: 0.36, dim: isDark ? 0.18 : 0.14 }
      : { columns: 6, tileWidth: 214, tileHeight: 142, gap: 18, radius: 8, tilt: 13, turn: -11, perspective: 1300, depth: 90, speed: 20, variance: 0.35, parallax: 0.36, lift: 40, fade: 0.32, dim: isDark ? 0.14 : 0.1 };

  return (
      <section className="home-hero relative isolate overflow-hidden border-b border-[var(--border-hairline)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.45) 4%, black 10%, black 90%, rgba(0,0,0,.45) 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,.45) 4%, black 10%, black 90%, rgba(0,0,0,.45) 96%, transparent 100%)',
          }}
        >
          {introReady && <DriftWall
            items={DRIFT_WALL_TILES}
            {...wall}
            direction="up"
            overlayColor={isDark ? '#101011' : '#fafafc'}
          />}
        </div>
        <div
          aria-hidden="true"
          className="hero-scrim pointer-events-none absolute inset-0"
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
            <LiquidButton variant="outline" style={{ backgroundColor: 'var(--surface)' }} onClick={() => router.push('/account')}>
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
  );
}
