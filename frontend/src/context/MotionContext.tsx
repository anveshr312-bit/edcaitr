'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Unified overlay stacking contract across the EDC AITR platform.
 * Preloader (100) > Toasts (90) > Command Palette (75) > Modal Dialogs & Sheets (65+)
 */
export const OVERLAY_Z = {
  MODAL_BASE: 65,
  COMMAND_PALETTE: 75,
  TOAST: 90,
  PRELOADER: 100,
} as const;

/**
 * Dual-track motion tokens separating public-facing editorial cadence
 * from fast, productivity-focused operational workspaces.
 */
export const MOTION_TRACKS = {
  publicEditorial: {
    ease: [0.16, 1, 0.3, 1] as const,
    headlineWordDuration: 0.42,
    headlineWordStagger: 0.036,
    headlineDistance: 10,
  },
  portalOperational: {
    ease: [0.2, 0, 0, 1] as const,
    fastDuration: 0.16,
    spring: {
      type: 'spring' as const,
      stiffness: 430,
      damping: 34,
      mass: 0.85,
    },
    bubbleSpring: {
      type: 'spring' as const,
      stiffness: 460,
      damping: 36,
      mass: 0.78,
    },
  },
} as const;

// Session-scoped registry so headings & reveals never replay on internal navigation or remounts
const sessionRevealedKeys = new Set<string>();

export function hasRevealedKey(key: string): boolean {
  return sessionRevealedKeys.has(key);
}

export function markRevealedKey(key: string): void {
  sessionRevealedKeys.add(key);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Returns true only on desktop/laptop devices with fine hover pointers.
 * Keeps pointer-tracked spotlights and subtle certificate tilt off touchscreens & mobile GPUs.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches);
    setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return fine;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * Traps Tab/Shift+Tab focus inside an active overlay container and restores
 * focus back to the element that triggered the overlay upon unmount/close.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  isTop: boolean,
  autoFocusFirst = true
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (autoFocusFirst) {
      const raf = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const autoEl = container.querySelector<HTMLElement>('[data-autofocus="true"]');
        if (autoEl) {
          autoEl.focus({ preventScroll: true });
          return;
        }
        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
          focusables[0].focus({ preventScroll: true });
        } else {
          container.focus({ preventScroll: true });
        }
      });
      return () => {
        cancelAnimationFrame(raf);
      };
    }
  }, [active, autoFocusFirst, containerRef]);

  // Restore focus when overlay deactivates
  useEffect(() => {
    if (active) return;
    const prev = previousFocusRef.current;
    if (prev && document.contains(prev)) {
      requestAnimationFrame(() => {
        prev.focus({ preventScroll: true });
      });
    }
    previousFocusRef.current = null;
  }, [active]);

  // Enforce Tab cycling when this overlay is the top-most active layer
  useEffect(() => {
    if (!active || !isTop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!current || current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!current || current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, isTop, containerRef]);
}

interface MotionContextValue {
  introReady: boolean;
  markIntroReady: () => void;
  reducedMotion: boolean;
  finePointer: boolean;
  // Overlay stack
  overlayStack: string[];
  registerOverlay: (id: string) => () => void;
  isTopOverlay: (id: string) => boolean;
  getOverlayZIndex: (id: string, baseZ: number) => number;
  // Global Command Palette state
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reducedMotion = usePrefersReducedMotion();
  const finePointer = useFinePointer();

  const [introReady, setIntroReady] = useState<boolean>(false);
  const [overlayStack, setOverlayStack] = useState<string[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const prevBodyOverflowRef = useRef<string | null>(null);

  const markIntroReady = useCallback(() => {
    setIntroReady(true);
  }, []);

  // Synchronize introReady immediately when preloader finishes or class drops
  useEffect(() => {
    if (introReady) return;
    if (!document.documentElement.classList.contains('edc-preloader-active')) {
      setIntroReady(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains('edc-preloader-active')) {
        setIntroReady(true);
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const guard = window.setTimeout(() => {
      setIntroReady(true);
      observer.disconnect();
    }, 4500);

    return () => {
      observer.disconnect();
      window.clearTimeout(guard);
    };
  }, [introReady]);

  const registerOverlay = useCallback((id: string) => {
    setOverlayStack((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return () => {
      setOverlayStack((prev) => prev.filter((item) => item !== id));
    };
  }, []);

  const isTopOverlay = useCallback(
    (id: string) => {
      if (overlayStack.length === 0) return false;
      return overlayStack[overlayStack.length - 1] === id;
    },
    [overlayStack]
  );

  const getOverlayZIndex = useCallback(
    (id: string, baseZ: number) => {
      const idx = overlayStack.indexOf(id);
      return idx >= 0 ? baseZ + idx * 2 : baseZ;
    },
    [overlayStack]
  );

  // Coordinated scroll lock across nested overlays (never unlocks prematurely)
  useEffect(() => {
    if (overlayStack.length > 0) {
      if (prevBodyOverflowRef.current === null) {
        prevBodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
    } else if (prevBodyOverflowRef.current !== null) {
      document.body.style.overflow = prevBodyOverflowRef.current;
      prevBodyOverflowRef.current = null;
    }
  }, [overlayStack.length]);

  useEffect(() => {
    return () => {
      if (prevBodyOverflowRef.current !== null) {
        document.body.style.overflow = prevBodyOverflowRef.current;
        prevBodyOverflowRef.current = null;
      }
    };
  }, []);

  const openCommandPalette = useCallback(() => {
    if (!introReady) return;
    setCommandPaletteOpen(true);
  }, [introReady]);

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    if (!introReady) return;
    setCommandPaletteOpen((prev) => !prev);
  }, [introReady]);

  // Global Cmd+K / Ctrl+K listener (disabled while preloader is active)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!introReady) return;
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [introReady]);

  const value = useMemo<MotionContextValue>(
    () => ({
      introReady,
      markIntroReady,
      reducedMotion,
      finePointer,
      overlayStack,
      registerOverlay,
      isTopOverlay,
      getOverlayZIndex,
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
    }),
    [
      introReady,
      markIntroReady,
      reducedMotion,
      finePointer,
      overlayStack,
      registerOverlay,
      isTopOverlay,
      getOverlayZIndex,
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
    ]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};

export function useMotionSystem(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useMotionSystem must be used inside MotionProvider');
  }
  return ctx;
}
