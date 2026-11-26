'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';

export type AnimationVariant =
  | 'circle'
  | 'rectangle'
  | 'gif'
  | 'polygon'
  | 'circle-blur';

export type AnimationStart =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'bottom-up'
  | 'top-down'
  | 'left-right'
  | 'right-left';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'edc_aitr_theme_mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    } catch {
      // ignore storage errors
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, restored]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export interface ThemeToggleOptions {
  variant?: AnimationVariant;
  start?: AnimationStart;
  blur?: boolean;
  gifUrl?: string;
}

/**
 * Creates GPU-accelerated View Transition styling without raster blur.
 * Animates a circle clip-path expanding from the click coordinates.
 */
export const createAnimation = (
  coords?: { x: number; y: number },
  start: AnimationStart = 'top-right'
) => {
  // Origin point
  const originX = coords ? `${Math.round(coords.x)}px` : start.includes('right') ? 'calc(100% - 40px)' : start.includes('left') ? '40px' : '50%';
  const originY = coords ? `${Math.round(coords.y)}px` : start.includes('bottom') ? 'calc(100% - 40px)' : '35px';

  return {
    name: 'theme-circular-reveal',
    css: `
      ::view-transition-group(root) {
        animation-duration: 0.45s;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      }
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }
      ::view-transition-old(root) {
        z-index: 1;
      }
      ::view-transition-new(root) {
        z-index: 9999;
        animation: theme-ripple-expand 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .dark::view-transition-old(root) {
        z-index: 1;
      }
      .dark::view-transition-new(root) {
        z-index: 9999;
        animation: theme-ripple-expand 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes theme-ripple-expand {
        from {
          clip-path: circle(0px at ${originX} ${originY});
        }
        to {
          clip-path: circle(150vmax at ${originX} ${originY});
        }
      }
    `,
  };
};

export const useThemeToggle = (options: ThemeToggleOptions = {}) => {
  const { theme, isDark, setTheme } = useTheme();
  const styleId = 'edc-theme-transition-styles';

  const updateStyles = useCallback((css: string) => {
    if (typeof window === 'undefined') return;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  }, []);

  const toggleTheme = useCallback(
    (coords?: { x: number; y: number }) => {
      const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const switchTheme = () => {
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        document.documentElement.style.colorScheme = nextTheme;
        setTheme(nextTheme);
      };

      const docWithTransition = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
      };

      if (prefersReduced || !docWithTransition.startViewTransition) {
        switchTheme();
        return;
      }

      const animation = createAnimation(coords, options.start || 'top-right');
      updateStyles(animation.css);

      try {
        docWithTransition.startViewTransition(switchTheme);
      } catch {
        switchTheme();
      }
    },
    [theme, setTheme, options.start, updateStyles]
  );

  return {
    theme,
    isDark,
    toggleTheme,
  };
};
