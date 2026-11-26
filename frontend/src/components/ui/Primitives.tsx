'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { OFFICIAL_LOGOS } from '../../data/seedData';
import { ToastMessage } from '../../types/portal';
import { useTheme } from '../../context/ThemeContext';
import {
  MOTION_TRACKS,
  OVERLAY_Z,
  useFocusTrap,
  useMotionSystem,
} from '../../context/MotionContext';
import { useResolvedMediaUrl } from '../../utils/mediaStorage';

export const EdcLogo: React.FC<{
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
}> = ({ variant = 'auto', className = 'h-10 w-auto' }) => {
  const { isDark } = useTheme();
  const resolved = variant === 'auto' ? (isDark ? 'dark' : 'light') : variant;
  const src = resolved === 'dark' ? OFFICIAL_LOGOS.darkSurface : OFFICIAL_LOGOS.lightSurface;
  return (
    <img
      src={src}
      alt="Entrepreneurship Development Cell · Acropolis Group of Institutions"
      className={`${className} object-contain select-none`}
      referrerPolicy="no-referrer"
    />
  );
};

export const MonogramAvatar: React.FC<{
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'neutral' | 'obsidian' | 'crimson';
}> = ({ name, size = 'md', tone = 'neutral' }) => {
  const initials = useMemo(() => {
    const clean = name.replace(/^(Dr\.|Prof\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }, [name]);

  const sizeClasses =
    size === 'sm'
      ? 'h-9 w-9 text-xs'
      : size === 'lg'
        ? 'h-14 w-14 text-base'
        : 'h-11 w-11 text-sm';

  const toneClasses =
    tone === 'obsidian'
      ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
      : tone === 'crimson'
        ? 'bg-[var(--accent-soft)] text-[#C01E30] dark:text-[#E67C87] border-[var(--accent-border)]'
        : 'bg-[var(--surface-subtle)] text-[var(--color-2-mood)] border-[var(--border-hairline)]';

  return (
    <div
      aria-hidden="true"
      className={`${sizeClasses} ${toneClasses} shrink-0 rounded-[9px] border flex items-center justify-center font-display font-semibold tracking-tight select-none`}
    >
      {initials}
    </div>
  );
};

export const EditorialImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  objectPosition?: string;
}> = ({ src, alt, className = 'w-full h-full object-cover', fallbackTitle, objectPosition }) => {
  const { resolvedUrl, loading, missing } = useResolvedMediaUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src, resolvedUrl]);

  if (loading) {
    return (
      <div className="w-full h-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col items-center justify-center p-6 text-center text-[var(--ink-muted)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-secondary)]" />
      </div>
    );
  }

  if (failed || missing || !resolvedUrl) {
    return (
      <div className="w-full h-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col items-center justify-center p-6 text-center text-[var(--ink-muted)]">
        <ImageIcon className="h-6 w-6 mb-2 text-[var(--ink-secondary)]" strokeWidth={1.6} />
        <p className="text-xs font-medium text-[var(--ink-secondary)]">{fallbackTitle || alt}</p>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={objectPosition ? { objectPosition } : undefined}
      className={className}
    />
  );
};

/**
 * Deterministic crisp vector QR matrix rendered purely in SVG.
 * Uses three authentic finder squares plus deterministic data bit hashing from `value`.
 */
export const QrCodeSvg: React.FC<{
  value: string;
  size?: number;
  label?: string;
}> = ({ value, size = 168, label }) => {
  const cells = 25;

  const matrix = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const grid: boolean[][] = Array.from({ length: cells }, () => Array(cells).fill(false));

    const drawFinder = (ox: number, oy: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[oy + r][ox + c] = isOuter || isInner;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);

    // Timing lines
    for (let i = 8; i < cells - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    const inFinderZone = (r: number, c: number) =>
      (r < 8 && c < 8) || (r < 8 && c >= cells - 8) || (r >= cells - 8 && c < 8);

    let seed = hash >>> 0;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (inFinderZone(r, c) || r === 6 || c === 6) continue;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const bit = ((seed >>> 24) ^ (r * 31 + c * 17)) & 3;
        grid[r][c] = bit === 0 || bit === 2;
      }
    }
    return grid;
  }, [value]);

  const pad = 2;
  const viewBoxSize = cells + pad * 2;

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        role="img"
        aria-label={label || `QR code for ${value}`}
        className="bg-white border border-[rgba(3,4,5,0.12)] rounded-[9px]"
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c + pad}
                y={r + pad}
                width={1}
                height={1}
                fill="#030405"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export const StatusBadge: React.FC<{
  label: string;
  tone?: 'crimson' | 'green' | 'amber' | 'neutral' | 'obsidian';
}> = ({ label, tone = 'neutral' }) => {
  const styles: Record<string, string> = {
    crimson:
      'bg-[var(--accent-soft)] text-[#C01E30] dark:text-[#E67C87] border-[var(--accent-border)]',
    green:
      'bg-[#ECFDF3] dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-300 border-[#BBF7D0] dark:border-emerald-800/70',
    amber:
      'bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border-[#FDE68A] dark:border-amber-800/70',
    neutral:
      'bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border-[var(--border-hairline)]',
    obsidian:
      'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]',
  };

  const Icon =
    tone === 'green'
      ? CheckCircle2
      : tone === 'amber'
        ? Clock
        : tone === 'crimson'
          ? ShieldCheck
          : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-[4px] whitespace-nowrap shrink-0 ${styles[tone]}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />}
      <span>{label}</span>
    </span>
  );
};

export const StudioButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'obsidian';
    loading?: boolean;
    size?: 'sm' | 'md';
  }
> = ({
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0 rounded-[9px] transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed';
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-xs min-h-[34px]' : 'px-4 py-2 text-sm min-h-[40px]';
  const variants: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    obsidian:
      'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border border-[#030405] dark:border-[#F1F0ED] hover:bg-[#1E1F23] dark:hover:bg-[#E2E0DB] disabled:opacity-50',
    ghost:
      'bg-transparent text-[var(--ink-secondary)] border border-transparent hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)] disabled:opacity-50',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${sizing} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
};

export const ModalDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  /** When true, closing via Escape, backdrop, or X prompts for discard confirmation */
  isDirty?: boolean;
  dirtyWarningText?: string;
  children: React.ReactNode;
}> = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  isDirty = false,
  dirtyWarningText = 'You have unsaved entries in this form. Discard your changes?',
  children,
}) => {
  const { registerOverlay, isTopOverlay, getOverlayZIndex, reducedMotion } = useMotionSystem();
  const overlayId = useId();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Register on unified overlay stack for scroll lock, z-index, and Escape precedence
  useEffect(() => {
    if (!open) {
      setConfirmingDiscard(false);
      return;
    }
    return registerOverlay(overlayId);
  }, [open, overlayId, registerOverlay]);

  const isTop = isTopOverlay(overlayId);
  const zIndex = getOverlayZIndex(overlayId, OVERLAY_Z.MODAL_BASE);

  // Focus trapping & restoration back to launching element on close
  useFocusTrap(open, panelRef, isTop, true);

  const requestClose = useCallback(() => {
    if (isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    setConfirmingDiscard(false);
    onClose();
  }, [isDirty, confirmingDiscard, onClose]);

  // Reset confirmation banner automatically if form becomes clean
  useEffect(() => {
    if (!isDirty && confirmingDiscard) {
      setConfirmingDiscard(false);
    }
  }, [isDirty, confirmingDiscard]);

  // Top-most overlay Escape handler
  useEffect(() => {
    if (!open || !isTop) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, isTop, requestClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key={`modal-backdrop-${overlayId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.16 }}
          style={{ zIndex }}
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-[#030405]/55 dark:bg-black/70 backdrop-blur-[4px] no-print"
          onClick={requestClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={subtitle ? descId : undefined}
            tabIndex={-1}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 10 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: 6 }
            }
            transition={
              reducedMotion
                ? { duration: 0.01 }
                : MOTION_TRACKS.portalOperational.spring
            }
            className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto bg-[var(--surface)] dark:bg-[#1B1B1E] border border-[var(--border-strong)] dark:border-[#303032] rounded-[11px] p-5 sm:p-6 shadow-2xl dark:shadow-[0_20px_48px_-14px_rgba(0,0,0,0.6)] outline-none`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
              <div className="min-w-0">
                <h3
                  id={titleId}
                  className="text-lg font-display font-semibold text-[var(--color-2-mood)]"
                >
                  {title}
                </h3>
                {subtitle && (
                  <p id={descId} className="text-sm text-[var(--ink-muted)] mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close dialog"
                className="h-9 w-9 rounded-[9px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)] transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inline Unsaved Changes Guard */}
            <AnimatePresence initial={false}>
              {confirmingDiscard && (
                <motion.div
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.15 }}
                  role="alertdialog"
                  aria-label="Discard unsaved changes"
                  className="mt-4 p-3.5 rounded-[9px] bg-[#FFFBEB] dark:bg-amber-950/50 border border-[#FDE68A] dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2 text-xs text-[var(--ink-secondary)]">
                    <AlertCircle className="h-4 w-4 text-[#B45309] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{dirtyWarningText}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StudioButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmingDiscard(false)}
                    >
                      Keep Editing
                    </StudioButton>
                    <StudioButton
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setConfirmingDiscard(false);
                        onClose();
                      }}
                    >
                      Discard &amp; Close
                    </StudioButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface PauseableToastItemProps {
  toast: ToastMessage;
  paused: boolean;
  onDismiss: (id: string) => void;
  reducedMotion: boolean;
}

const PauseableToastItem: React.FC<PauseableToastItemProps> = ({
  toast,
  paused,
  onDismiss,
  reducedMotion,
}) => {
  const totalMs = toast.durationMs ?? 4200;
  const remainingRef = useRef<number>(totalMs);
  const startedAtRef = useRef<number | null>(null);
  const [progressPct, setProgressPct] = useState(100);

  // Pauseable timer that halts cleanly whenever pointer hovers OR keyboard focus enters stack
  useEffect(() => {
    if (paused) {
      if (startedAtRef.current !== null) {
        const elapsed = Date.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        startedAtRef.current = null;
      }
      return;
    }

    if (remainingRef.current <= 0) {
      onDismiss(toast.id);
      return;
    }

    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, remainingRef.current);

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;
      const left = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
      setProgressPct((left / totalMs) * 100);
    }, 80);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      if (startedAtRef.current !== null) {
        const elapsed = Date.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        startedAtRef.current = null;
      }
    };
  }, [paused, toast.id, totalMs, onDismiss]);

  const Icon =
    toast.tone === 'success'
      ? CheckCircle2
      : toast.tone === 'warning'
        ? AlertCircle
        : toast.tone === 'error'
          ? XCircle
          : ShieldCheck;

  const iconColor =
    toast.tone === 'success'
      ? 'text-[#15803D] dark:text-emerald-400'
      : toast.tone === 'warning'
        ? 'text-[#B45309] dark:text-amber-400'
        : toast.tone === 'error'
          ? 'text-[#C01E30] dark:text-rose-400'
          : 'text-[var(--color-2-mood)]';

  const barColor =
    toast.tone === 'success'
      ? 'bg-[#15803D] dark:bg-emerald-400'
      : toast.tone === 'warning'
        ? 'bg-[#B45309] dark:bg-amber-400'
        : toast.tone === 'error'
          ? 'bg-[#C01E30] dark:bg-rose-400'
          : 'bg-[var(--color-2-mood)]';

  return (
    <motion.div
      layout={!reducedMotion}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      drag={reducedMotion ? false : 'x'}
      dragConstraints={{ left: 0, right: 240 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (info.offset.x > 72 || info.velocity.x > 320) {
          onDismiss(toast.id);
        }
      }}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 14, scale: 0.96 }
      }
      animate={
        reducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: 40, scale: 0.96 }
      }
      transition={
        reducedMotion
          ? { duration: 0.01 }
          : MOTION_TRACKS.portalOperational.spring
      }
      className="relative overflow-hidden bg-[var(--surface)] dark:bg-[#1D1D20] border border-[var(--border-strong)] dark:border-[#303032] rounded-[10px] px-4 py-3 shadow-lg dark:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.6)] flex items-start gap-3"
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor}`} strokeWidth={1.8} />
      <div className="min-w-0 flex-1 pr-1">
        <p className="text-sm font-medium text-[var(--color-2-mood)] leading-snug">
          {toast.title}
        </p>
        {toast.detail && (
          <p className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
            {toast.detail}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss notification: ${toast.title}`}
        className="h-8 w-8 -mr-1.5 -mt-1 rounded-[7px] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--color-2-mood)] hover:bg-[var(--surface-subtle)] transition-colors shrink-0 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Subtle pauseable progress bar */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--border-hairline)]"
      >
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${barColor} ${
            paused ? 'opacity-45' : 'opacity-80'
          }`}
          style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastStack: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  const { reducedMotion } = useMotionSystem();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  if (typeof document === 'undefined') return null;

  const isPaused = hovered || focused;

  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      style={{ zIndex: OVERLAY_Z.TOAST }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-[360px] pointer-events-none no-print"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <PauseableToastItem
              toast={toast}
              paused={isPaused}
              onDismiss={onDismiss}
              reducedMotion={reducedMotion}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
