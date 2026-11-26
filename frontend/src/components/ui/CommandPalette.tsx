'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calendar,
  ClipboardCheck,
  Home,
  Info,
  KanbanSquare,
  LayoutDashboard,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Moon,
  QrCode,
  Rocket,
  Search,
  ShieldCheck,
  Sun,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useThemeToggle } from '../../context/ThemeContext';
import {
  MOTION_TRACKS,
  OVERLAY_Z,
  useFocusTrap,
  useMotionSystem,
} from '../../context/MotionContext';
import {
  CommandIconKey,
  CommandItem,
  searchPortalEntities,
} from '../../lib/commandSearch';

const PALETTE_OVERLAY_ID = 'edc-global-command-palette';

const renderItemIcon = (key: CommandIconKey, isDark: boolean) => {
  const cls = 'h-4 w-4 shrink-0';
  switch (key) {
    case 'home':
      return <Home className={cls} strokeWidth={1.7} />;
    case 'calendar':
      return <Calendar className={cls} strokeWidth={1.7} />;
    case 'users':
      return <Users className={cls} strokeWidth={1.7} />;
    case 'info':
      return <Info className={cls} strokeWidth={1.7} />;
    case 'mail':
      return <Mail className={cls} strokeWidth={1.7} />;
    case 'ticket':
      return <Ticket className={cls} strokeWidth={1.7} />;
    case 'award':
      return <Award className={cls} strokeWidth={1.7} />;
    case 'megaphone':
      return <Megaphone className={cls} strokeWidth={1.7} />;
    case 'building':
      return <Building2 className={cls} strokeWidth={1.7} />;
    case 'rocket':
      return <Rocket className={cls} strokeWidth={1.7} />;
    case 'briefcase':
      return <Briefcase className={cls} strokeWidth={1.7} />;
    case 'message':
      return <MessageSquare className={cls} strokeWidth={1.7} />;
    case 'dashboard':
      return <LayoutDashboard className={cls} strokeWidth={1.7} />;
    case 'qr':
      return <QrCode className={cls} strokeWidth={1.7} />;
    case 'kanban':
      return <KanbanSquare className={cls} strokeWidth={1.7} />;
    case 'clipboard':
      return <ClipboardCheck className={cls} strokeWidth={1.7} />;
    case 'shield':
      return <ShieldCheck className={cls} strokeWidth={1.7} />;
    case 'lock':
      return <Lock className={cls} strokeWidth={1.7} />;
    case 'theme':
      return isDark ? (
        <Sun className={cls} strokeWidth={1.7} />
      ) : (
        <Moon className={cls} strokeWidth={1.7} />
      );
    case 'user':
    default:
      return <User className={cls} strokeWidth={1.7} />;
  }
};

/**
 * Compact responsive top-bar trigger for the Global Command Palette.
 * Desktop: Search icon + subtle shortcut hint (⌘K / Ctrl K).
 * Mobile: Clean 40–44px icon-only touch target with zero desktop shortcut labels.
 */
export const CommandPaletteTrigger: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { openCommandPalette } = useMotionSystem();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Open quick search"
      aria-keyshortcuts="Meta+K Control+K"
      className={`inline-flex items-center justify-center sm:justify-between gap-2 h-10 w-10 sm:h-9 sm:w-auto sm:px-2.5 rounded-[9px] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:text-[var(--color-2-mood)] hover:bg-[var(--surface-subtle)] transition-colors duration-150 cursor-pointer shrink-0 ${className}`}
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <span className="hidden md:inline text-xs text-[var(--ink-muted)] pr-1">
        Search
      </span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] font-mono-data text-[10px] font-medium text-[var(--ink-muted)] leading-none">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
};

export const CommandPalette: React.FC = () => {
  const {
    currentUser,
    events,
    users,
    teamAllocations,
    tasks,
    certificates,
    startups,
    opportunities,
    conversations,
    activeWorkspaceEventId,
    setActiveWorkspaceEventId,
    navigate,
  } = usePortal();
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const titleId = useId();

  // Clear query, selection, and close palette immediately whenever auth identity or role changes (logout / switch)
  const sessionFingerprint = `${currentUser?.id ?? 'guest'}::${currentUser?.role ?? 'none'}`;
  useEffect(() => {
    setQuery('');
    setActiveIndex(0);
    closeCommandPalette();
  }, [sessionFingerprint, closeCommandPalette]);

  // Register on unified overlay stack
  useEffect(() => {
    if (!commandPaletteOpen) return;
    return registerOverlay(PALETTE_OVERLAY_ID);
  }, [commandPaletteOpen, registerOverlay]);

  const isTop = isTopOverlay(PALETTE_OVERLAY_ID);
  const zIndex = getOverlayZIndex(PALETTE_OVERLAY_ID, OVERLAY_Z.COMMAND_PALETTE);

  useFocusTrap(commandPaletteOpen, dialogRef, isTop, true);

  // Reset search input on close
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [commandPaletteOpen]);

  // Permission-scoped search computation (only runs while open; zero retained restricted cache when closed)
  const searchResult = useMemo(() => {
    if (!commandPaletteOpen) {
      return { items: [] as CommandItem[], groups: [], totalCount: 0 };
    }
    return searchPortalEntities(query, {
      currentUser,
      events,
      users,
      teamAllocations,
      tasks,
      certificates,
      startups,
      opportunities,
      conversations,
      activeWorkspaceEventId,
      isDark,
    });
  }, [
    commandPaletteOpen,
    query,
    currentUser,
    events,
    users,
    teamAllocations,
    tasks,
    certificates,
    startups,
    opportunities,
    conversations,
    activeWorkspaceEventId,
    isDark,
  ]);

  // Clamp active highlight index whenever results change
  useEffect(() => {
    setActiveIndex((prev) => {
      if (searchResult.items.length === 0) return 0;
      return Math.min(prev, searchResult.items.length - 1);
    });
  }, [searchResult.items.length]);

  // Scroll active option into view smoothly when navigating with keyboard
  useEffect(() => {
    if (!commandPaletteOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${activeIndex}"]`
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, commandPaletteOpen]);

  const executeItem = (item: CommandItem) => {
    closeCommandPalette();
    if (item.actionType === 'toggle-theme') {
      toggleTheme();
      return;
    }
    if (item.workspaceEventId) {
      setActiveWorkspaceEventId(item.workspaceEventId);
    }
    if (item.href) {
      navigate(item.href);
    }
  };

  // Top-of-stack Escape & keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen || !isTop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeCommandPalette();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (searchResult.items.length > 0) {
          setActiveIndex((prev) => (prev + 1) % searchResult.items.length);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (searchResult.items.length > 0) {
          setActiveIndex((prev) =>
            prev <= 0 ? searchResult.items.length - 1 : prev - 1
          );
        }
        return;
      }
      if (e.key === 'Enter') {
        const chosen = searchResult.items[activeIndex];
        if (chosen) {
          e.preventDefault();
          executeItem(chosen);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [commandPaletteOpen, isTop, searchResult.items, activeIndex, closeCommandPalette]);

  if (typeof document === 'undefined') return null;

  const activeItem = searchResult.items[activeIndex];
  const activeDescendantId = activeItem ? `${listboxId}-opt-${activeItem.id}` : undefined;

  const emptySuggestions = currentUser
    ? ['events', 'cert', 'alumni', 'messages']
    : ['events', 'summit', 'team', 'contact'];

  let flatCounter = -1;

  return createPortal(
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          key="cmd-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.14 }}
          style={{ zIndex }}
          className="fixed inset-0 flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-3 sm:px-4 bg-[#030405]/55 dark:bg-black/70 backdrop-blur-[4px] no-print"
          onClick={closeCommandPalette}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: -8 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: -4 }
            }
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : MOTION_TRACKS.portalOperational.spring
            }
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[600px] overflow-hidden rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] dark:bg-[#1B1B1E] dark:border-[#303032] shadow-2xl dark:shadow-[0_20px_50px_-14px_rgba(0,0,0,0.65)] outline-none"
          >
            <h2 id={titleId} className="sr-only">
              EDC AITR Quick Jump Command Palette
            </h2>

            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-hairline)]">
              <Search
                className="h-4 w-4 text-[#C01E30] dark:text-[#F87171] shrink-0"
                strokeWidth={2}
              />
              <input
                ref={inputRef}
                data-autofocus="true"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendantId}
                aria-label="Search events, teams, alumni, or portal tools"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={
                  currentUser
                    ? 'Jump to events, certificates, alumni, or workspace tools...'
                    : 'Search public events, 12 teams, or pages...'
                }
                className="w-full bg-transparent text-sm text-[var(--color-2-mood)] placeholder:text-[var(--ink-muted)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="h-7 w-7 rounded-[6px] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--color-2-mood)] hover:bg-[var(--surface-subtle)] cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={closeCommandPalette}
                aria-label="Close command palette"
                className="inline-flex sm:hidden h-8 w-8 rounded-[6px] border border-[var(--border-hairline)] items-center justify-center text-[var(--ink-secondary)] shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] font-mono-data text-[10px] text-[var(--ink-muted)] shrink-0">
                ESC
              </kbd>
            </div>

            {/* Accessible Live Result Count Announcer */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {query.trim()
                ? searchResult.totalCount === 0
                  ? `No results found for ${query}`
                  : `${searchResult.totalCount} ${searchResult.totalCount === 1 ? 'result' : 'results'} available`
                : `${searchResult.totalCount} quick suggestions available`}
            </div>

            {/* Grouped Results Listbox */}
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="max-h-[58vh] sm:max-h-[400px] overflow-y-auto p-2 space-y-2"
            >
              {searchResult.items.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-3">
                  <p className="text-sm font-medium text-[var(--color-2-mood)]">
                    No matching items for “{query}”
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto">
                    Try searching by event name, team code (RD, AV, CLIX), or shortcut keywords below.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {emptySuggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          setActiveIndex(0);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs font-mono-data text-[var(--color-2-mood)] hover:border-[#C01E30] cursor-pointer transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                searchResult.groups.map((grp) => (
                  <div key={grp.group} className="space-y-0.5">
                    <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-[var(--ink-muted)] flex items-center justify-between">
                      <span>{grp.group}</span>
                      <span className="font-mono-data text-[10px]">
                        {grp.items.length}
                      </span>
                    </div>
                    {grp.items.map((item) => {
                      flatCounter += 1;
                      const currentIdx = flatCounter;
                      const isActive = currentIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          id={`${listboxId}-opt-${item.id}`}
                          data-cmd-index={currentIdx}
                          role="option"
                          aria-selected={isActive}
                          type="button"
                          onMouseEnter={() => setActiveIndex(currentIdx)}
                          onClick={() => executeItem(item)}
                          className={`w-full text-left px-2.5 py-2 rounded-[8px] flex items-center gap-3 transition-colors duration-100 cursor-pointer ${
                            isActive
                              ? 'bg-[var(--accent-soft)] text-[var(--color-2-mood)]'
                              : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]'
                          }`}
                        >
                          <span
                            className={`h-8 w-8 rounded-[7px] border flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'border-[var(--accent-border)] bg-[var(--surface)] text-[#C01E30] dark:text-[#F87171]'
                                : 'border-[var(--border-hairline)] bg-[var(--color-1-mood)] text-[var(--ink-muted)]'
                            }`}
                          >
                            {renderItemIcon(item.icon, isDark)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--color-2-mood)] truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-[var(--ink-muted)] truncate">
                              {item.subtitle}
                            </p>
                          </div>
                          {item.badge && (
                            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--color-1-mood)] font-mono-data text-[10px] text-[var(--ink-secondary)] shrink-0">
                              {item.badge}
                            </span>
                          )}
                          <ArrowRight
                            className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                              isActive
                                ? 'opacity-100 text-[#C01E30] dark:text-[#F87171]'
                                : 'opacity-0'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer Hints (Desktop) */}
            <div className="hidden sm:flex items-center justify-between px-4 py-2 border-t border-[var(--border-hairline)] bg-[var(--color-1-mood)] text-[11px] text-[var(--ink-muted)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface)] font-mono-data text-[10px]">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--surface)] font-mono-data text-[10px]">
                    ↵
                  </kbd>
                  <span>Open</span>
                </span>
              </div>
              <span className="font-mono-data text-[10px]">
                Scope: {currentUser ? currentUser.role.replace('_', ' ') : 'public'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
