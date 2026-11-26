'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '../../context/ThemeContext';
import { MotionProvider, useMotionSystem } from '../../context/MotionContext';
import { PortalProvider } from '../../context/PortalContext';
import { CommandPalette } from '../ui/CommandPalette';
import { Search } from 'lucide-react';

function CommandPaletteTrigger() {
  const { openCommandPalette } = useMotionSystem();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Open global search (Press ⌘K or Ctrl+K)"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface)] text-[var(--color-2-mood)] border border-[var(--border-strong)] shadow-lg hover:shadow-xl hover:border-[var(--color-3-accent-personality)] transition-all duration-200 cursor-pointer group"
      >
        <Search className="h-4 w-4 text-[var(--color-3-accent-personality)] group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold">Search Portal</span>
        <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--ink-muted)]">
          ⌘K
        </kbd>
      </button>
      <CommandPalette />
    </>
  );
}

export function GlobalMotionShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <PortalProvider>
          {children}
          <CommandPaletteTrigger />
        </PortalProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
