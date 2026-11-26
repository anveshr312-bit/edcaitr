'use client';

import React from 'react';
import { ThemeProvider } from '../../context/ThemeContext';
import { MotionProvider } from '../../context/MotionContext';
import { AppCommandPalette } from '../ui/AppCommandPalette';

export function GlobalMotionShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        {children}
        <AppCommandPalette />
      </MotionProvider>
    </ThemeProvider>
  );
}
