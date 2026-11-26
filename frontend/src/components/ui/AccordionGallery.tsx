'use client';

import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';

export interface AccordionGalleryItem {
  image: string;
  label?: string;
  subtitle?: string;
  code?: string;
  link?: string;
  alt?: string;
}

export interface AccordionGalleryProps {
  items: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  /** Optional strength of grayscale on inactive panels (0..1). Defaults to restrained 0.35. */
  inactiveGrayscale?: number;
  /** Optional dimming opacity on inactive panels (0..1). Defaults to restrained 0.28. */
  inactiveDim?: number;
  onActiveChange?: (index: number, item: AccordionGalleryItem) => void;
  onItemClick?: (item: AccordionGalleryItem, index: number) => void;
  className?: string;
}

export const AccordionGallery: React.FC<AccordionGalleryProps> = ({
  items,
  defaultIndex = 0,
  accentColor = '#C01E30',
  overlayColor = '#101011',
  textColor = '#ffffff',
  height = 440,
  gap = 10,
  radius = 8,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.58,
  ease = 'power3.out',
  parallax = 0.32,
  tilt = 0,
  stagger = 0.05,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  inactiveGrayscale = 0.35,
  inactiveDim = 0.28,
  onActiveChange,
  onItemClick,
  className = '',
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(560);

  const vertical = orientation === 'vertical';
  const count = items.length;
  const [active, setActive] = useState(
    Math.min(Math.max(defaultIndex, 0), Math.max(0, count - 1))
  );
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const setActiveSafe = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= count) return;
      setActive(nextIndex);
      if (items[nextIndex]) {
        onActiveChange?.(nextIndex, items[nextIndex]);
      }
    },
    [count, items, onActiveChange]
  );

  const applyLayout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;

      const r = Math.min(Math.max(expandRatio, 0.25), 0.85);
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      const mediaSize = mediaSizeRef.current;
      // Keep parallax strictly within half of the 14% oversized media bleed so edges are never exposed
      const maxShift = Math.min(18, Math.max(6, mediaSize * 0.032));

      tlRef.current?.kill();
      const dur = animate && !reduced ? duration : 0;
      const tl = gsap.timeline();

      panels.forEach((panel, i) => {
        if (!panel) return;
        const isActive = i === active;
        const media = mediaRefs.current[i];
        const dimEl = dimRefs.current[i];
        const bar = barRefs.current[i];
        const text = textRefs.current[i];

        const rot = tilt > 0 ? (isActive ? 0 : i < active ? tilt : -tilt) : 0;
        const rotProp = vertical
          ? { rotateX: -rot, rotateY: 0 }
          : { rotateY: rot, rotateX: 0 };

        tl.to(
          panel,
          { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease },
          0
        );

        if (media) {
          const drift = Math.max(-1, Math.min(1, active - i));
          const shift = drift * parallax * maxShift;
          const gray = grayscale ? (isActive ? 0 : inactiveGrayscale) : 0;

          if (firstRunRef.current || dur === 0) {
            gsap.set(media, {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              scale: isActive ? 1 : 1.03,
              '--ag-gray': gray,
            });
          } else {
            tl.to(
              media,
              {
                xPercent: -50,
                yPercent: -50,
                x: vertical ? 0 : isActive ? 0 : shift,
                y: vertical ? (isActive ? 0 : shift) : 0,
                scale: isActive ? 1 : 1.03,
                '--ag-gray': gray,
                duration: dur,
                ease,
              },
              0
            );
          }
        }

        if (dimEl) {
          tl.to(
            dimEl,
            {
              opacity: isActive ? 0 : inactiveDim,
              duration: dur,
              ease,
            },
            0
          );
        }

        if (showLabels && bar && text) {
          if (isActive) {
            tl.to(
              [bar, text],
              {
                opacity: 1,
                x: 0,
                duration: dur,
                ease,
                stagger: reduced ? 0 : stagger,
              },
              0
            );
          } else {
            tl.to(
              [bar, text],
              { opacity: 0, x: -10, duration: dur * 0.55, ease },
              0
            );
          }
        }
      });

      tlRef.current = tl;
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      tilt,
      parallax,
      grayscale,
      inactiveGrayscale,
      inactiveDim,
      showLabels,
      stagger,
      reduced,
    ]
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * Math.max(0, count - 1), 160);
      const r = Math.min(Math.max(expandRatio, 0.25), 0.85);
      // Size media cleanly to 114% of the active expanded dimension so curtain reveal never exposes gaps
      const size = Math.max(220, Math.ceil(usable * r * 1.14));
      mediaSizeRef.current = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRunRef.current);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, gap, count, expandRatio, vertical]);

  useEffect(() => {
    applyLayout(!firstRunRef.current);
    firstRunRef.current = false;
  }, [applyLayout]);

  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    []
  );

  const handlePointerEnter = (i: number, e: React.PointerEvent) => {
    if (trigger === 'hover' && e.pointerType === 'mouse') {
      setActiveSafe(i);
    }
  };

  const handleClick = (i: number, e: React.MouseEvent) => {
    if (i !== active) {
      e.preventDefault();
      setActiveSafe(i);
      return;
    }
    if (onItemClick && items[i]) {
      e.preventDefault();
      onItemClick(items[i], i);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (i + 1) % count;
      setActiveSafe(next);
      panelRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (i - 1 + count) % count;
      setActiveSafe(prev);
      panelRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveSafe(0);
      panelRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = count - 1;
      setActiveSafe(last);
      panelRefs.current[last]?.focus();
    } else if (e.key === ' ') {
      e.preventDefault();
      setActiveSafe(i);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (i !== active) {
        setActiveSafe(i);
      } else if (onItemClick && items[i]) {
        onItemClick(items[i], i);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className={`accordion-gallery${vertical ? ' accordion-gallery--vertical' : ''}${className ? ` ${className}` : ''}`}
      style={
        {
          '--ag-accent': accentColor,
          '--ag-overlay': overlayColor,
          '--ag-text': textColor,
          '--ag-gap': `${gap}px`,
          '--ag-radius': `${radius}px`,
          height: `${height}px`,
        } as CSSProperties
      }
      role="tablist"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label="EDC AITR Initiatives Accordion Gallery"
    >
      {items.map((item, i) => {
        const isActive = i === active;
        const hasFailed = Boolean(failedImages[i]);
        const indexLabel = String(i + 1).padStart(2, '0');

        return (
          <div
            key={`${item.label ?? i}-${i}`}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className={`ag-panel${isActive ? ' ag-panel--active' : ''}`}
            style={{ borderRadius: `${radius}px` }}
            onClick={(e) => handleClick(i, e)}
            onPointerEnter={(e) => handlePointerEnter(i, e)}
            onFocus={() => setActiveSafe(i)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            aria-label={item.label || `Initiative ${indexLabel}`}
          >
            <span className="ag-panel__frame">
              <span
                className="ag-panel__media"
                ref={(el) => {
                  mediaRefs.current[i] = el;
                }}
              >
                {hasFailed || !item.image ? (
                  <span className="ag-panel__fallback" aria-hidden="true">
                    <span className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-[#D93848]">
                      {item.code || indexLabel}
                    </span>
                    <span className="mt-1.5 font-display text-base font-semibold text-white">
                      {item.label}
                    </span>
                  </span>
                ) : (
                  <img
                    src={item.image}
                    alt={item.alt || item.label || ''}
                    loading={i === defaultIndex ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [i]: true }))
                    }
                  />
                )}
              </span>
              <span
                className="ag-panel__dim"
                ref={(el) => {
                  dimRefs.current[i] = el;
                }}
                aria-hidden="true"
              />
              <span className="ag-panel__overlay" aria-hidden="true" />
            </span>

            {/* Quiet index + collapsed panel hint so inactive panels remain identifiable */}
            <span className="ag-panel__index" aria-hidden="true">
              <span className="ag-panel__index-num">{indexLabel}</span>
              {!isActive && vertical && item.label && (
                <span className="ag-panel__collapsed-title">{item.label}</span>
              )}
            </span>

            {showLabels && (
              <span className="ag-panel__label" aria-hidden="true">
                <span
                  className="ag-panel__bar"
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                />
                <span
                  className="ag-panel__text"
                  ref={(el) => {
                    textRefs.current[i] = el;
                  }}
                >
                  {item.label}
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AccordionGallery;
