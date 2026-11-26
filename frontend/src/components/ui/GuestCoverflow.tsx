'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Guest } from '../../data/seedData';
import { useMotionSystem } from '../../context/MotionContext';

export interface GuestCoverflowProps {
  guests: Guest[];
  initialIndex?: number;
  className?: string;
}

type ViewportTier = 'mobile' | 'tablet' | 'desktop';

const DRAG_ACTIVATION_PX = 8;
const DRAG_STEP_THRESHOLD_PX = 48;

function getInitials(name: string): string {
  const clean = name.replace(/^(Dr\.|Prof\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ED';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function getCircularOffset(index: number, active: number, count: number): number {
  if (count <= 1) return 0;
  let diff = (index - active) % count;
  if (diff > count / 2) diff -= count;
  if (diff <= -count / 2) diff += count;
  return diff;
}

/**
 * Interactive Coverflow Drag portrait carousel for the EDC AITR Speaker Archive.
 * Supports looping arrangement, pointer/touch drag & swipe, spring depth physics,
 * click-to-focus, keyboard arrow navigation, reduced-motion accessibility, and
 * archival monogram portrait fallback when authentic guest photographs are absent.
 */
export const GuestCoverflow: React.FC<GuestCoverflowProps> = ({
  guests,
  initialIndex = 0,
  className = '',
}) => {
  const { reducedMotion } = useMotionSystem();
  const count = guests.length;
  const [active, setActive] = useState(() =>
    count > 0 ? ((initialIndex % count) + count) % count : 0
  );
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [viewport, setViewport] = useState<ViewportTier>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const tabletMq = window.matchMedia('(min-width: 640px)');
    const sync = () => {
      if (desktopMq.matches) setViewport('desktop');
      else if (tabletMq.matches) setViewport('tablet');
      else setViewport('mobile');
    };
    sync();
    desktopMq.addEventListener('change', sync);
    tabletMq.addEventListener('change', sync);
    return () => {
      desktopMq.removeEventListener('change', sync);
      tabletMq.removeEventListener('change', sync);
    };
  }, []);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocityX: number;
    lockedAxis: 'x' | 'y' | null;
    moved: boolean;
  } | null>(null);
  const suppressClickUntilRef = useRef<number>(0);

  const metrics = useMemo(() => {
    if (viewport === 'mobile') {
      return {
        cardW: 236,
        cardH: 314,
        stageH: 348,
        step1: 164,
        step2: 280,
        visibleRange: 1,
      };
    }
    if (viewport === 'tablet') {
      return {
        cardW: 252,
        cardH: 336,
        stageH: 374,
        step1: 204,
        step2: 356,
        visibleRange: 2,
      };
    }
    return {
      cardW: 284,
      cardH: 374,
      stageH: 416,
      step1: 244,
      step2: 432,
      visibleRange: 2,
    };
  }, [viewport]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count <= 0) return;
      setActive(((nextIndex % count) + count) % count);
    },
    [count]
  );

  const stepBy = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setActive((prev) => (((prev + delta) % count) + count) % count);
    },
    [count]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest('button[data-coverflow-control]')) {
      return;
    }
    pointerStateRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocityX: 0,
      lockedAxis: null,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointerStateRef.current;
    if (!p || p.id !== e.pointerId) return;

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;

    if (!p.lockedAxis) {
      if (Math.abs(dx) < DRAG_ACTIVATION_PX && Math.abs(dy) < DRAG_ACTIVATION_PX) {
        return;
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        p.lockedAxis = 'y';
        pointerStateRef.current = null;
        return;
      }
      p.lockedAxis = 'x';
      p.moved = true;
      setIsDragging(true);
      try {
        stageRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // ignore capture errors on synthetic events
      }
    }

    const now = performance.now();
    const dt = Math.max(1, now - p.lastTime);
    p.velocityX = ((e.clientX - p.lastX) / dt) * 1000;
    p.lastX = e.clientX;
    p.lastTime = now;

    // Subtle rubber-band clamp prevents overly rapid multi-card flicking
    const clamped = Math.max(-metrics.step1 * 0.88, Math.min(metrics.step1 * 0.88, dx));
    setDragDeltaX(clamped);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const p = pointerStateRef.current;
    if (!p || p.id !== e.pointerId) return;
    pointerStateRef.current = null;

    if (p.moved) {
      try {
        stageRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const dx = e.clientX - p.startX;
      suppressClickUntilRef.current = performance.now() + 260;

      if (!cancelled) {
        if (dx <= -DRAG_STEP_THRESHOLD_PX || p.velocityX < -420) {
          stepBy(1);
        } else if (dx >= DRAG_STEP_THRESHOLD_PX || p.velocityX > 420) {
          stepBy(-1);
        }
      }
    }

    setDragDeltaX(0);
    setIsDragging(false);
  };

  const handleCardClick = (index: number) => {
    if (performance.now() < suppressClickUntilRef.current) return;
    if (index !== active) {
      goTo(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepBy(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(count - 1);
    }
  };

  if (count === 0) return null;

  const activeGuest = guests[active];

  return (
    <div className={className}>
      {/* Interactive Coverflow Stage */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="EDC AITR Guests We Hosted Speaker Archive"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishDrag(e, false)}
        onPointerCancel={(e) => finishDrag(e, true)}
        onLostPointerCapture={(e) => finishDrag(e, true)}
        className={`relative w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#C01E30] rounded-[8px] select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          height: `${metrics.stageH}px`,
          perspective: '1150px',
          touchAction: 'pan-y',
        }}
      >
        {/* Soft horizontal edge fade keeps side peeks architectural */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 z-40 bg-gradient-to-r from-[var(--color-1-mood)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 z-40 bg-gradient-to-l from-[var(--color-1-mood)] to-transparent"
        />

        <div className="relative w-full h-full flex items-center justify-center">
          {guests.map((guest, idx) => {
            const diff = getCircularOffset(idx, active, count);
            const absDiff = Math.abs(diff);
            const isActive = diff === 0;
            const isVisible = absDiff <= metrics.visibleRange;
            const hasPhoto = Boolean(guest.image && !failedImages[guest.id]);
            const initials = getInitials(guest.name);
            const orderLabel = String(idx + 1).padStart(2, '0');

            let baseX = 0;
            if (absDiff === 1) baseX = diff * metrics.step1;
            else if (absDiff === 2) baseX = Math.sign(diff) * metrics.step2;
            else if (absDiff > 2) baseX = Math.sign(diff) * (metrics.step2 + 120);

            const targetX = baseX + (isDragging ? dragDeltaX * (isActive ? 0.65 : 0.45) : 0);
            const targetScale = isActive ? 1 : absDiff === 1 ? 0.86 : 0.74;
            const targetRotateY = isActive
              ? 0
              : absDiff === 1
                ? diff * -18
                : Math.sign(diff) * -28;
            const targetOpacity = !isVisible
              ? 0
              : isActive
                ? 1
                : absDiff === 1
                  ? 0.84
                  : 0.52;
            const zIndex = isActive ? 30 : absDiff === 1 ? 20 : absDiff === 2 ? 10 : 1;

            return (
              <motion.article
                key={guest.id}
                aria-hidden={!isVisible}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => handleCardClick(idx)}
                animate={{
                  x: targetX,
                  scale: targetScale,
                  rotateY: reducedMotion ? 0 : targetRotateY,
                  opacity: targetOpacity,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0.01 }
                    : isDragging
                      ? { type: 'tween', duration: 0.05, ease: 'linear' }
                      : { type: 'spring', stiffness: 250, damping: 29, mass: 0.9 }
                }
                style={{
                  width: `${metrics.cardW}px`,
                  height: `${metrics.cardH}px`,
                  zIndex,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  transformStyle: 'preserve-3d',
                }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[8px] overflow-hidden border transition-colors ${
                  isActive
                    ? 'border-[#C01E30] dark:border-[#D93848] ring-1 ring-[#C01E30]/35 dark:ring-[#D93848]/45 shadow-[0_20px_44px_-24px_rgba(3,4,5,0.48)] cursor-default'
                    : 'border-[var(--border-strong)]/70 dark:border-[#303032] shadow-[0_12px_28px_-20px_rgba(3,4,5,0.35)] cursor-pointer'
                }`}
              >
                {/* Portrait Field — Authentic Photograph OR Archival Monogram Plate */}
                <div className="relative w-full h-full bg-[#161619]">
                  {hasPhoto ? (
                    <img
                      src={guest.image}
                      alt={guest.alt}
                      loading={isActive ? 'eager' : 'lazy'}
                      fetchPriority={isActive ? 'high' : 'auto'}
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [guest.id]: true }))
                      }
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `50% ${50 + (guest.offsetY ?? 0)}%`,
                      }}
                    />
                  ) : (
                    <div
                      aria-label={guest.alt}
                      className="relative w-full h-full flex flex-col justify-between p-5 sm:p-6"
                      style={{
                        background:
                          idx % 2 === 0
                            ? 'linear-gradient(160deg, #1F1F23 0%, #141417 58%, #0E0E10 100%)'
                            : 'linear-gradient(160deg, #222024 0%, #151518 58%, #0F0F11 100%)',
                      }}
                    >
                      {/* Subtle architectural rule & index */}
                      <div className="flex items-center justify-between text-[11px] font-mono-data tracking-[0.14em] text-white/55 border-b border-white/10 pb-3">
                        <span>{orderLabel}</span>
                        <span className={isActive ? 'text-[#E35D6A]' : 'text-white/45'}>
                          EDC ARCHIVE
                        </span>
                      </div>

                      {/* Centered editorial monogram silhouette */}
                      <div className="flex-1 flex items-center justify-center pb-14">
                        <span
                          aria-hidden="true"
                          className={`font-display font-bold tracking-[-0.04em] select-none transition-colors duration-300 ${
                            isActive ? 'text-white/[0.16]' : 'text-white/[0.1]'
                          }`}
                          style={{ fontSize: 'clamp(4.25rem, 6vw, 5.25rem)' }}
                        >
                          {initials}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Subtle dimming scrim on inactive side portraits */}
                  {!isActive && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#101011]/25 pointer-events-none"
                    />
                  )}

                  {/* Restrained Bottom Gradient Scrim for Crisp Portrait Typography */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[56%] pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(12, 12, 14, 0.94) 0%, rgba(12, 12, 14, 0.72) 48%, rgba(12, 12, 14, 0) 100%)',
                    }}
                  />

                  {/* Synchronized Guest Identity (Name, Designation, Organization) */}
                  <div
                    className={`absolute inset-x-0 bottom-0 p-5 sm:p-6 text-left transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-90'
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="block w-6 h-[2px] bg-[#C01E30] dark:bg-[#D93848] mb-3"
                      />
                    )}
                    <h3 className="font-display font-bold text-white text-lg sm:text-[1.25rem] leading-[1.15] tracking-[-0.02em]">
                      {guest.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-[13px] font-medium text-white/90 leading-snug">
                      {guest.designation}
                    </p>
                    {guest.organization && (
                      <p className="mt-0.5 text-xs text-white/70 leading-snug">
                        {guest.organization}
                      </p>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Synchronized Archival Control Bar & Active Edition Metadata */}
      <div className="mt-5 pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0" aria-live="polite">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="font-mono-data font-medium tracking-[0.1em] text-[#C01E30] dark:text-[#D93848]">
              {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <span aria-hidden="true" className="text-[var(--border-strong)]">·</span>
            <span className="font-medium text-[var(--color-2-mood)]">
              {activeGuest.name}
            </span>
            {activeGuest.edition && (
              <>
                <span aria-hidden="true" className="text-[var(--border-strong)]">·</span>
                <span className="text-[var(--ink-secondary)]">{activeGuest.edition}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            data-coverflow-control
            onClick={() => stepBy(-1)}
            aria-label="Previous guest"
            className="h-9 w-9 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--surface)] dark:bg-[#171719] text-[var(--color-2-mood)] hover:border-[#C01E30] hover:text-[#C01E30] dark:hover:border-[#D93848] dark:hover:text-[#D93848] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-coverflow-control
            onClick={() => stepBy(1)}
            aria-label="Next guest"
            className="h-9 w-9 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--surface)] dark:bg-[#171719] text-[var(--color-2-mood)] hover:border-[#C01E30] hover:text-[#C01E30] dark:hover:border-[#D93848] dark:hover:text-[#D93848] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestCoverflow;
