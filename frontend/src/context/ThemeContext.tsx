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
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

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

interface AnimationDef {
  name: string;
  css: string;
}

const getPositionCoords = (position: AnimationStart) => {
  switch (position) {
    case 'top-left':
      return { cx: '0', cy: '0' };
    case 'top-right':
      return { cx: '40', cy: '0' };
    case 'bottom-left':
      return { cx: '0', cy: '40' };
    case 'bottom-right':
      return { cx: '40', cy: '40' };
    case 'top-center':
      return { cx: '20', cy: '0' };
    case 'bottom-center':
      return { cx: '20', cy: '40' };
    case 'bottom-up':
    case 'top-down':
    case 'left-right':
    case 'right-left':
    case 'center':
    default:
      return { cx: '20', cy: '20' };
  }
};

const getTransformOrigin = (start: AnimationStart) => {
  switch (start) {
    case 'top-left':
      return 'top left';
    case 'top-right':
      return 'top right';
    case 'bottom-left':
      return 'bottom left';
    case 'bottom-right':
      return 'bottom right';
    case 'top-center':
      return 'top center';
    case 'bottom-center':
      return 'bottom center';
    default:
      return 'center';
  }
};

const generateSVG = (variant: AnimationVariant, start: AnimationStart) => {
  if (variant === 'circle-blur') {
    if (start === 'center') {
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="20" cy="20" r="18" fill="white" filter="url(%23blur)"/></svg>`;
    }
    const { cx, cy } = getPositionCoords(start);
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`;
  }
  if (start === 'center' || variant === 'rectangle') return '';
  const { cx, cy } = getPositionCoords(start);
  if (variant === 'circle') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`;
  }
  return '';
};

export const createAnimation = (
  variant: AnimationVariant,
  start: AnimationStart = 'top-right',
  blur = false,
  url?: string
): AnimationDef => {
  const svg = generateSVG(variant, start);
  const transformOrigin = getTransformOrigin(start);

  if (variant === 'rectangle') {
    const getClipPath = (direction: AnimationStart) => {
      switch (direction) {
        case 'top-down':
          return {
            from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          };
        case 'left-right':
          return {
            from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          };
        case 'right-left':
          return {
            from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          };
        case 'top-right':
          return {
            from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          };
        case 'bottom-up':
        default:
          return {
            from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          };
      }
    };
    const clipPath = getClipPath(start);
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: var(--expo-out);
        }
        ::view-transition-new(root) {
          animation-name: reveal-light-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        .dark::view-transition-new(root) {
          animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
          from { clip-path: ${clipPath.from}; ${blur ? 'filter: blur(8px);' : ''} }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to { clip-path: ${clipPath.to}; ${blur ? 'filter: blur(0px);' : ''} }
        }
        @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
          from { clip-path: ${clipPath.from}; ${blur ? 'filter: blur(8px);' : ''} }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to { clip-path: ${clipPath.to}; ${blur ? 'filter: blur(0px);' : ''} }
        }
      `,
    };
  }

  if (variant === 'circle' && start === 'center') {
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: var(--expo-out);
        }
        ::view-transition-new(root) {
          animation-name: reveal-light${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        .dark::view-transition-new(root) {
          animation-name: reveal-dark${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        @keyframes reveal-dark${blur ? '-blur' : ''} {
          from {
            clip-path: circle(0% at 50% 50%);
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: circle(100% at 50% 50%);
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
        @keyframes reveal-light${blur ? '-blur' : ''} {
          from {
            clip-path: circle(0% at 50% 50%);
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: circle(100% at 50% 50%);
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
      `,
    };
  }

  if (variant === 'circle' && start !== 'center') {
    const getClipPathPosition = (position: AnimationStart) => {
      switch (position) {
        case 'top-left':
          return '0% 0%';
        case 'top-right':
          return '100% 0%';
        case 'bottom-left':
          return '0% 100%';
        case 'bottom-right':
          return '100% 100%';
        case 'top-center':
          return '50% 0%';
        case 'bottom-center':
          return '50% 100%';
        default:
          return '50% 50%';
      }
    };
    const clipPosition = getClipPathPosition(start);
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 1s;
          animation-timing-function: var(--expo-out);
        }
        ::view-transition-new(root) {
          animation-name: reveal-light-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        .dark::view-transition-new(root) {
          animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: circle(0% at ${clipPosition});
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: circle(150% at ${clipPosition});
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
        @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
          from {
            clip-path: circle(0% at ${clipPosition});
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            clip-path: circle(150% at ${clipPosition});
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
      `,
    };
  }

  if (variant === 'circle-blur') {
    const maskPosition = start === 'center' ? 'center' : start.replace('-', ' ');
    const animName = `scale-theme-${start}${blur ? '-blur' : ''}`;
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
        ::view-transition-group(root) {
          animation-duration: 1s;
          animation-timing-function: var(--expo-out);
        }
        ::view-transition-new(root) {
          -webkit-mask: url('${svg}') ${maskPosition} / 0 no-repeat;
          mask: url('${svg}') ${maskPosition} / 0 no-repeat;
          -webkit-mask-origin: content-box;
          mask-origin: content-box;
          animation: ${animName} 1s var(--expo-out) both;
          transform-origin: ${transformOrigin};
          ${blur ? 'filter: blur(2px);' : ''}
        }
        ::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        @keyframes ${animName} {
          from {
            -webkit-mask-size: 0;
            mask-size: 0;
            ${blur ? 'filter: blur(8px);' : ''}
          }
          ${blur ? '50% { filter: blur(4px); }' : ''}
          to {
            -webkit-mask-size: 350vmax;
            mask-size: 350vmax;
            ${blur ? 'filter: blur(0px);' : ''}
          }
        }
      `,
    };
  }

  return {
    name: `${variant}-${start}${blur ? '-blur' : ''}`,
    css: `
      ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: var(--expo-out);
      }
      ::view-transition-new(root) {
        ${url ? `mask: url('${url}') center / 0 no-repeat;` : 'animation-name: reveal-center;'}
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      @keyframes reveal-center {
        from {
          clip-path: circle(0% at 50% 50%);
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(140% at 50% 50%);
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
    `,
  };
};

export const useThemeToggle = ({
  variant = 'circle-blur',
  start = 'top-right',
  blur = true,
  gifUrl = '',
}: {
  variant?: AnimationVariant;
  start?: AnimationStart;
  blur?: boolean;
  gifUrl?: string;
} = {}) => {
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

  const toggleTheme = useCallback(() => {
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
      startViewTransition?: (cb: () => void) => void;
    };

    if (prefersReduced || !docWithTransition.startViewTransition) {
      switchTheme();
      return;
    }

    const animation = createAnimation(variant, start, blur, gifUrl);
    updateStyles(animation.css);
    docWithTransition.startViewTransition(switchTheme);
  }, [theme, setTheme, variant, start, blur, gifUrl, updateStyles]);

  return {
    theme,
    isDark,
    toggleTheme,
  };
};
