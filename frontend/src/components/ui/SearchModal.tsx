'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCheck,
  FileDown,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export interface SearchTag {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SearchResultAction {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}

export interface SearchResult {
  id?: string;
  name: string;
  meta?: string;
  tagId?: string;
  initials?: string;
  avatar?: string;
  href?: string;
  actions?: SearchResultAction[];
}

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
}

export interface SearchFile {
  name: string;
  ext?: string;
  icon?: React.ReactNode;
  verified?: boolean;
  onShare?: () => void;
}

export interface SearchModalProps {
  placeholder?: string;
  tags?: SearchTag[];
  results?: SearchResult[];
  quickActions?: QuickAction[];
  files?: SearchFile[];
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  onSelectResult?: (result: SearchResult, index: number) => void;
  className?: string;
  modal?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hotkey?: string | null;
  closeOnEscape?: boolean;
  overlayClassName?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  placeholder = 'Search alumni, founders, startups, or briefs...',
  tags = [],
  results = [],
  quickActions = [],
  files = [],
  defaultQuery = '',
  onQueryChange,
  onSelectResult,
  className = '',
  modal = false,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = 'k',
  closeOnEscape = true,
  overlayClassName = '',
}) => {
  const [query, setQuery] = useState(defaultQuery);
  const [activeTags, setActiveTags] = useState<SearchTag[]>(tags);

  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const openRef = useRef(actualOpen);
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    openRef.current = actualOpen;
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        hotkey &&
        e.key.toLowerCase() === hotkey.toLowerCase() &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        setOpenRef.current(!openRef.current);
      } else if (closeOnEscape && e.key === 'Escape' && openRef.current) {
        setOpenRef.current(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, hotkey, closeOnEscape]);

  useEffect(() => {
    if (modal && actualOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [modal, actualOpen]);

  const activeTagIds = useMemo(
    () => new Set(activeTags.map((t) => t.id)),
    [activeTags]
  );

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter((r) => {
      if (activeTags.length > 0 && r.tagId && !activeTagIds.has(r.tagId)) {
        return false;
      }
      if (!q) return true;
      return `${r.name} ${r.meta ?? ''}`.toLowerCase().includes(q);
    });
  }, [query, results, activeTags.length, activeTagIds]);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (activeTags.length > 0 && !activeTagIds.has('resources')) {
      return [];
    }
    if (!q) return files;
    return files.filter((f) =>
      `${f.name}${f.ext ?? ''}`.toLowerCase().includes(q)
    );
  }, [query, files, activeTags.length, activeTagIds]);

  const handleQuery = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  const removeTag = (index: number) =>
    setActiveTags((prev) => prev.filter((_, i) => i !== index));

  const resetTags = () => setActiveTags(tags);

  const panel = (
    <div
      role={modal ? 'dialog' : undefined}
      aria-modal={modal ? true : undefined}
      aria-label="Alumni Connect Command Search"
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border backdrop-blur-xl border-black/[0.08] bg-white/95 text-[#030405] shadow-[0_14px_46px_-14px_rgba(3,4,5,0.28)] dark:border-[#303032] dark:bg-[#1B1B1E]/96 dark:text-[#F1F0ED] dark:shadow-[0_20px_50px_-16px_rgba(0,0,0,0.68)] ${className}`}
    >
      {/* Search bar */}
      <div className="flex items-center gap-1 border-b border-black/[0.07] px-4 py-3.5 dark:border-white/[0.08]">
        <Search className="h-[18px] w-[18px] text-[var(--ink-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search Alumni Connect"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-current outline-none placeholder:text-[var(--ink-muted)]"
        />
        <div className="flex shrink-0 items-center gap-2">
          {activeTags.length < tags.length && (
            <button
              type="button"
              onClick={resetTags}
              title="Restore all filter tags"
              aria-label="Restore filter tags"
              className="text-[var(--ink-muted)] transition-colors hover:text-[#C01E30] cursor-pointer"
            >
              <SlidersHorizontal className="h-[17px] w-[17px]" />
            </button>
          )}
          <kbd className="flex items-center gap-0.5 rounded-md border border-black/[0.08] bg-black/[0.04] px-1.5 py-0.5 font-mono-data text-[11px] font-medium text-[var(--ink-muted)] dark:border-white/[0.1] dark:bg-white/[0.06]">
            <span>⌘</span>
            <span>{modal && hotkey ? hotkey.toUpperCase() : 'K'}</span>
          </kbd>
          {modal && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close search modal"
              className="ml-1 text-[var(--ink-muted)] hover:text-[#C01E30] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Removable Scope Tags */}
      {activeTags.length > 0 && (
        <div className="border-b border-black/[0.07] px-4 py-3 dark:border-white/[0.08]">
          <span className="text-xs text-[var(--ink-muted)]">
            I&apos;m looking for...
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {activeTags.map((tag, i) => (
              <span
                key={`${tag.id}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] py-1 pl-2.5 pr-2 text-xs font-medium ring-1 ring-inset ring-black/[0.06] dark:bg-white/[0.07] dark:ring-white/[0.08]"
              >
                {tag.icon}
                <span>{tag.label}</span>
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  aria-label={`Remove ${tag.label}`}
                  className="text-[var(--ink-muted)] transition-colors hover:text-[#C01E30] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border-b border-black/[0.07] dark:border-white/[0.08]">
          <p className="px-4 pt-3 pb-1.5 text-xs text-[var(--ink-muted)]">
            Matches{' '}
            <span className="font-mono-data font-semibold text-[var(--color-2-mood)] ml-1">
              {filteredResults.length}
            </span>
          </p>
          {filteredResults.length === 0 ? (
            <p className="px-4 pb-4 text-xs text-[var(--ink-muted)]">
              No matching profiles or startups found. Try adjusting your query or restoring tags.
            </p>
          ) : (
            <ul className="px-1.5 pb-1.5 max-h-[220px] overflow-y-auto">
              {filteredResults.slice(0, 6).map((result, i) => (
                <li key={`${result.id ?? result.name}-${i}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectResult?.(result, i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectResult?.(result, i);
                      }
                    }}
                    className="group relative flex items-center rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    {result.avatar ? (
                      <img
                        src={result.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                      />
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-full bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] text-[11px] font-semibold flex items-center justify-center">
                        {result.initials ??
                          result.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join('')
                            .toUpperCase()}
                      </span>
                    )}
                    <span className="ml-2.5 truncate text-sm font-medium">
                      {result.name}
                      {result.meta ? (
                        <span className="pl-1.5 font-normal text-xs text-[var(--ink-muted)]">
                          {result.meta}
                        </span>
                      ) : null}
                    </span>
                    {result.actions && result.actions.length > 0 ? (
                      <span className="ml-auto flex items-center gap-2 pl-3 text-[var(--ink-muted)] opacity-80 transition-opacity group-hover:opacity-100">
                        {result.actions.map((action, ai) => (
                          <button
                            key={ai}
                            type="button"
                            title={action.label}
                            aria-label={action.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick?.();
                            }}
                            className="p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.1] hover:text-[#C01E30] transition-colors cursor-pointer"
                          >
                            {action.icon}
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="border-b border-black/[0.07] px-1.5 py-1.5 dark:border-white/[0.08]">
          <p className="px-2.5 pt-2 pb-1 text-xs text-[var(--ink-muted)]">
            Quick actions
          </p>
          {quickActions.map((action, i) => (
            <button
              key={`${action.label}-${i}`}
              type="button"
              onClick={() => {
                action.onClick?.();
                if (modal) setOpen(false);
              }}
              className="relative flex w-full items-center rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-black/[0.05] text-[var(--ink-secondary)] dark:bg-white/[0.07]">
                {action.icon ?? <Plus className="h-[15px] w-[15px]" />}
              </span>
              <span className="pl-3 text-sm">{action.label}</span>
              {action.shortcut ? (
                <kbd className="ml-auto flex h-[24px] min-w-[24px] px-1.5 items-center justify-center rounded-md bg-black/[0.05] font-mono-data text-[11px] text-[var(--ink-muted)] ring-1 ring-inset ring-black/[0.06] dark:bg-white/[0.07] dark:ring-white/[0.08]">
                  {action.shortcut}
                </kbd>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Institutional Files */}
      {filteredFiles.length > 0 && (
        <div className="px-1.5 py-1.5">
          <p className="px-2.5 pt-2 pb-1 text-xs text-[var(--ink-muted)]">
            Shared Briefs{' '}
            <span className="font-mono-data text-[var(--color-2-mood)] ml-1">
              {filteredFiles.length}
            </span>
          </p>
          {filteredFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="group relative flex items-center rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-black/[0.05] text-[var(--ink-secondary)] dark:bg-white/[0.07]">
                {file.icon ?? <FileDown className="h-[15px] w-[15px]" />}
              </span>
              <span className="flex items-center gap-1.5 pl-3 text-sm">
                <span>
                  {file.name}
                  {file.ext ? (
                    <span className="text-[var(--ink-muted)]">{file.ext}</span>
                  ) : null}
                </span>
                {file.verified ? (
                  <CheckCheck className="h-4 w-4 text-emerald-500" />
                ) : null}
              </span>
              <button
                type="button"
                onClick={file.onShare}
                className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] transition-colors hover:text-[#C01E30] cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!modal) return panel;

  return (
    <div
      onClick={() => setOpen(false)}
      aria-hidden={!actualOpen}
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] transition-opacity duration-200 ${
        actualOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${overlayClassName}`}
    >
      <div className="absolute inset-0 bg-[#030405]/50 backdrop-blur-sm dark:bg-black/70" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-xl transition-all duration-200 ease-out ${
          actualOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : '-translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        {panel}
      </div>
    </div>
  );
};

export default SearchModal;
