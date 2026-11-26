'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { useThemeToggle } from '../../context/ThemeContext';
import { MOTION_TRACKS, OVERLAY_Z, useFocusTrap, useMotionSystem } from '../../context/MotionContext';

const ROUTES = [
  { title: 'Home', subtitle: 'Return to the EDC AITR homepage', href: '/', terms: 'start landing' },
  { title: 'Events', subtitle: 'Explore upcoming EDC events', href: '/events', terms: 'calendar workshops summit' },
  { title: 'About EDC', subtitle: 'Learn about the Entrepreneurship Development Cell', href: '/about', terms: 'about mission vision' },
  { title: 'Team', subtitle: 'Meet the EDC AITR team', href: '/team', terms: 'people members leadership' },
  { title: 'Contact', subtitle: 'Get in touch with EDC AITR', href: '/contact', terms: 'email message' },
  { title: 'Sign in', subtitle: 'Access your EDC AITR account', href: '/account/dashboard', terms: 'login account authentication' },
  { title: 'Participant portal', subtitle: 'Open participant services', href: '/portal', terms: 'registration ticket participant' },
  { title: 'Alumni directory', subtitle: 'Explore the alumni community', href: '/alumni/directory', terms: 'alumni network' },
  { title: 'Workspace', subtitle: 'Open the authorized EDC workspace', href: '/workspace', terms: 'operations dashboard team' },
] as const;

const OVERLAY_ID = 'edc-app-command-palette';

export function AppCommandPaletteTrigger() {
  const { openCommandPalette } = useMotionSystem();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Open quick search"
      aria-keyshortcuts="Meta+K Control+K"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-[9px] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)] sm:h-9 sm:w-auto sm:justify-between sm:px-2.5"
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span className="hidden pr-1 text-xs text-[var(--ink-muted)] md:inline">Search</span>
      <kbd className="hidden items-center gap-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-1.5 py-0.5 font-mono-data text-[10px] font-medium leading-none text-[var(--ink-muted)] sm:inline-flex">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
}

export function AppCommandPalette() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeToggle();
  const {
    commandPaletteOpen,
    closeCommandPalette,
    registerOverlay,
    isTopOverlay,
    getOverlayZIndex,
    reducedMotion,
  } = useMotionSystem();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const titleId = useId();
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const routes = ROUTES.filter(({ title, subtitle, terms }) =>
      `${title} ${subtitle} ${terms}`.toLowerCase().includes(needle)
    );
    return [
      ...routes.map((route) => ({ ...route, id: route.href, kind: 'route' as const })),
      ...(isDark
        ? [{ id: 'theme', title: 'Switch to light theme', subtitle: 'Change the site appearance', kind: 'theme' as const }]
        : [{ id: 'theme', title: 'Switch to dark theme', subtitle: 'Change the site appearance', kind: 'theme' as const }]),
    ];
  }, [isDark, query]);
  const isTop = isTopOverlay(OVERLAY_ID);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    return registerOverlay(OVERLAY_ID);
  }, [commandPaletteOpen, registerOverlay]);
  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(results.length - 1, 0)));
  }, [results.length]);
  useFocusTrap(commandPaletteOpen, dialogRef, isTop);

  useEffect(() => {
    if (!commandPaletteOpen || !isTop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCommandPalette();
      } else if (event.key === 'ArrowDown' && results.length) {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % results.length);
      } else if (event.key === 'ArrowUp' && results.length) {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
      } else if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault();
        const selected = results[activeIndex];
        closeCommandPalette();
        if (selected.kind === 'theme') toggleTheme();
        else router.push(selected.href);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [activeIndex, closeCommandPalette, commandPaletteOpen, isTop, results, router, toggleTheme]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          key="app-command-palette-backdrop"
          className="fixed inset-0 z-[75] flex items-start justify-center bg-[#030405]/55 px-3 pt-[8vh] backdrop-blur-[4px] sm:px-4 sm:pt-[12vh]"
          style={{ zIndex: getOverlayZIndex(OVERLAY_ID, OVERLAY_Z.COMMAND_PALETTE) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.14 }}
          onClick={closeCommandPalette}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="w-full max-w-[600px] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl outline-none dark:border-[#303032] dark:bg-[#1B1B1E]"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -4 }}
            transition={reducedMotion ? { duration: 0.01 } : MOTION_TRACKS.portalOperational.spring}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">EDC AITR Quick Jump</h2>
            <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[#C01E30] dark:text-[#F87171]" />
              <input
                ref={inputRef}
                data-autofocus="true"
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                aria-controls={listId}
                aria-label="Search EDC AITR pages"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search pages and public services..."
                className="w-full bg-transparent text-sm text-[var(--color-2-mood)] placeholder:text-[var(--ink-muted)] focus:outline-none"
              />
              <button type="button" onClick={closeCommandPalette} aria-label="Close command palette" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div id={listId} role="listbox" aria-label="Pages and actions" className="max-h-[58vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-[var(--ink-muted)]">No matching pages.</p>
              ) : results.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    closeCommandPalette();
                    if (item.kind === 'theme') toggleTheme();
                    else router.push(item.href);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${index === activeIndex ? 'bg-[var(--accent-soft)] text-[var(--color-2-mood)]' : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]'}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[var(--border-hairline)] bg-[var(--color-1-mood)] text-[#C01E30] dark:text-[#F87171]"><Search className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-[var(--ink-muted)]">{item.subtitle}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#C01E30] dark:text-[#F87171]" />
                </button>
              ))}
            </div>
            <div className="hidden items-center justify-between border-t border-[var(--border-hairline)] bg-[var(--color-1-mood)] px-4 py-2 text-[11px] text-[var(--ink-muted)] sm:flex">
              <span>↑↓ Navigate · ↵ Open</span><span>ESC Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
