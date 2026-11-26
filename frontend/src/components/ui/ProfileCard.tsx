'use client';

import React, { type CSSProperties, memo, useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import {
  EDC_CONTOUR_PATHS,
  EDC_CRIMSON,
  EDC_MONOGRAM_FOIL_DATA_URL,
} from './EdcMark';

export interface ProfileCardProps {
  avatarUrl?: string;
  iconUrl?: string;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  theme?: 'dark' | 'light';
  backdropColor?: string;
  radius?: number;
  holo?: number;
  glare?: number;
  enableTilt?: boolean;
  tiltStrength?: number;
  parallax?: number;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  intro?: boolean;
  className?: string;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--pc-frame': 'rgba(23, 23, 25, 0.92)',
    '--pc-frame-edge': '#303032',
    '--pc-frame-highlight': 'rgba(241, 240, 237, 0.06)',
    '--pc-frame-shadow':
      '0 20px 40px -20px rgba(0, 0, 0, 0.78), 0 6px 16px -8px rgba(0, 0, 0, 0.45)',
    '--pc-tile': 'linear-gradient(180deg, #1d1d20 0%, #101011 100%)',
    '--pc-tile-edge': 'rgba(241, 240, 237, 0.08)',
    '--pc-tile-highlight': 'rgba(241, 240, 237, 0.1)',
    '--pc-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.65)',
    '--pc-ink': '#F1F0ED',
    '--pc-muted': '#A4A4A8',
    '--pc-hover': 'brightness(1.08)',
    '--pc-press': 'brightness(0.88)',
    '--pc-shade': 'rgba(0, 0, 0, 0.38)',
  },
  light: {
    '--pc-frame': 'rgba(248, 248, 250, 0.88)',
    '--pc-frame-edge': 'rgba(3, 4, 5, 0.1)',
    '--pc-frame-highlight': 'rgba(255, 255, 255, 0.96)',
    '--pc-frame-shadow':
      '0 22px 44px -22px rgba(3, 4, 5, 0.28), 0 6px 16px -10px rgba(3, 4, 5, 0.16)',
    '--pc-tile': 'linear-gradient(180deg, #ffffff 0%, #f1f2f5 100%)',
    '--pc-tile-edge': 'rgba(3, 4, 5, 0.08)',
    '--pc-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--pc-tile-shadow': '0 4px 10px -5px rgba(3, 4, 5, 0.2)',
    '--pc-ink': '#030405',
    '--pc-muted': 'rgba(3, 4, 5, 0.62)',
    '--pc-hover': 'brightness(0.96)',
    '--pc-press': 'brightness(0.92)',
    '--pc-shade': 'rgba(3, 4, 5, 0.14)',
  },
};

const FOILS: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--pc-blend': 'color-dodge',
    '--pc-holo-filter': 'hue-rotate(0deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0.16)',
  },
  light: {
    '--pc-blend': 'multiply',
    '--pc-holo-filter': 'invert(1) hue-rotate(180deg)',
    '--pc-sheen': 'rgba(255, 255, 255, 0)',
  },
};

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)}")`;

/** Repeating official EDC AITR monogram pattern for holographic foil mask. */
export const EDC_FOIL_PATTERN_DATA_URL = EDC_MONOGRAM_FOIL_DATA_URL;

/**
 * Generates deterministic high-contrast editorial monogram crest artwork
 * for Alumni Connect ProfileCard popups (zero external photo dependencies).
 */
export function createEditorialCrestDataUrl(params: {
  name: string;
  batch?: string;
  company?: string;
  roleBadge?: string;
}): string {
  const initials = params.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const safeBatch = (params.batch ? `BATCH ${params.batch}` : 'EDC AITR').replace(
    /[<>&'"]/g,
    ''
  );
  const safeBadge = (params.roleBadge || 'VERIFIED FELLOW')
    .toUpperCase()
    .slice(0, 22)
    .replace(/[<>&'"]/g, '');
  const safeCompany = (params.company || 'ACROPOLIS INDORE')
    .toUpperCase()
    .slice(0, 26)
    .replace(/[<>&'"]/g, '');

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='800' viewBox='0 0 640 800'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#1b1b1e'/>
        <stop offset='55%' stop-color='#101011'/>
        <stop offset='100%' stop-color='#1c1214'/>
      </linearGradient>
      <radialGradient id='glow' cx='50%' cy='36%' r='52%'>
        <stop offset='0%' stop-color='#C01E30' stop-opacity='0.28'/>
        <stop offset='100%' stop-color='#C01E30' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='640' height='800' fill='url(#bg)'/>
    <rect width='640' height='800' fill='url(#glow)'/>
    <g stroke='#F1F0ED' stroke-opacity='0.09' fill='none'>
      <rect x='34' y='34' width='572' height='732' rx='18'/>
      <line x1='34' y1='112' x2='606' y2='112'/>
      <circle cx='320' cy='344' r='164'/>
      <circle cx='320' cy='344' r='132' stroke-dasharray='4 8'/>
      <line x1='116' y1='344' x2='156' y2='344'/>
      <line x1='484' y1='344' x2='524' y2='344'/>
    </g>
    <text x='64' y='82' font-family='monospace' font-size='18' font-weight='600' letter-spacing='3' fill='${EDC_CRIMSON}'>${safeBatch}</text>
    <text x='576' y='82' text-anchor='end' font-family='monospace' font-size='16' font-weight='500' letter-spacing='2' fill='#F1F0ED' fill-opacity='0.68'>${safeBadge}</text>
    <g transform='translate(284 146) scale(0.068)' fill='${EDC_CRIMSON}' fill-opacity='0.9'>
      <path d='${EDC_CONTOUR_PATHS.main}'/>
      <path d='${EDC_CONTOUR_PATHS.eUpper}'/>
    </g>
    <circle cx='320' cy='366' r='108' fill='#171719' stroke='${EDC_CRIMSON}' stroke-width='2.5'/>
    <text x='320' y='398' text-anchor='middle' font-family='sans-serif' font-size='96' font-weight='700' letter-spacing='-2' fill='#F1F0ED'>${initials}</text>
    <text x='320' y='560' text-anchor='middle' font-family='monospace' font-size='15' font-weight='600' letter-spacing='4' fill='#F1F0ED' fill-opacity='0.54'>${safeCompany}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isDarkHex = (color: string) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color).trim());
  if (!match) return null;
  const hex =
    match[1].length === 3
      ? match[1].replace(/./g, (digit) => digit + digit)
      : match[1];
  const [r, g, b] = [0, 2, 4].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
};

export const ProfileCard: React.FC<ProfileCardProps> = memo(
  ({
    avatarUrl = '',
    iconUrl,
    miniAvatarUrl,
    name = 'EDC Member',
    title = 'Founder & Alumni',
    handle = 'edcaitr',
    status = 'Verified Alumni',
    statusColor = '#C01E30',
    contactText = 'Message',
    showUserInfo = true,
    onContactClick,
    theme = 'dark',
    backdropColor,
    radius = 16,
    holo = 0.75,
    glare = 0.45,
    enableTilt = true,
    tiltStrength = 11,
    parallax = 8,
    enableMobileTilt = false,
    mobileTiltSensitivity = 5,
    intro = true,
    className = '',
  }) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<{
      aim: (nx: number, ny: number, on?: boolean) => void;
      release: () => void;
      write: () => void;
    } | null>(null);

    const settingsRef = useRef({
      enableTilt,
      tiltStrength,
      parallax,
      mobileTiltSensitivity,
      intro,
    });
    settingsRef.current = {
      enableTilt,
      tiltStrength,
      parallax,
      mobileTiltSensitivity,
      intro,
    };

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const size = { width: root.offsetWidth, height: root.offsetHeight };
      const x = { p: 0, v: 0, target: 0 };
      const y = { p: 0, v: 0, target: 0 };
      const light = { p: 0, target: 0 };
      let raf = 0;
      let last = 0;
      let slowUntil = 0;
      let touchId: number | null = null;

      const write = () => {
        const {
          enableTilt: tiltOn,
          tiltStrength: strength,
          parallax: depth,
        } = settingsRef.current;
        const angle = tiltOn && !reduced ? strength : 0;
        const tilt = Math.min(1, Math.hypot(x.p, y.p));
        const style = root.style;
        style.setProperty(
          '--pc-light-x',
          `${((x.p + 1) * 0.5 * size.width).toFixed(1)}px`
        );
        style.setProperty(
          '--pc-light-y',
          `${((y.p + 1) * 0.5 * size.height).toFixed(1)}px`
        );
        style.setProperty(
          '--pc-pointer-x',
          `${((x.p + 1) * 50).toFixed(2)}%`
        );
        style.setProperty(
          '--pc-pointer-y',
          `${((y.p + 1) * 50).toFixed(2)}%`
        );
        style.setProperty('--pc-band-x', `${(50 + x.p * 15).toFixed(2)}%`);
        style.setProperty('--pc-band-y', `${(50 + y.p * 15).toFixed(2)}%`);
        style.setProperty('--pc-rotate-x', `${(y.p * angle).toFixed(3)}deg`);
        style.setProperty('--pc-rotate-y', `${(-x.p * angle).toFixed(3)}deg`);
        style.setProperty(
          '--pc-shift-x',
          `${(x.p * (reduced ? 0 : depth)).toFixed(2)}px`
        );
        style.setProperty(
          '--pc-shift-y',
          `${(y.p * (reduced ? 0 : depth)).toFixed(2)}px`
        );
        style.setProperty('--pc-reach', tilt.toFixed(4));
        style.setProperty('--pc-tilt', (tilt * light.p).toFixed(4));
        style.setProperty('--pc-active', light.p.toFixed(4));
      };

      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        const slow = now < slowUntil;
        const stiffness = slow ? 24 : 120;
        const damping = slow ? 9 : 16;
        const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          for (const axis of [x, y]) {
            axis.v +=
              (stiffness * (axis.target - axis.p) - damping * axis.v) * h;
            axis.p += axis.v * h;
          }
        }
        const tau = light.target > light.p ? 0.18 : slow ? 0.9 : 0.45;
        light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));
        write();
        const moving =
          Math.abs(x.target - x.p) > 0.0005 ||
          Math.abs(y.target - y.p) > 0.0005 ||
          Math.abs(x.v) > 0.0005 ||
          Math.abs(y.v) > 0.0005 ||
          Math.abs(light.target - light.p) > 0.002;
        if (moving) {
          raf = requestAnimationFrame(frame);
        } else {
          x.p = x.target;
          y.p = y.target;
          light.p = light.target;
          write();
          raf = 0;
        }
      };

      const wake = () => {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };

      const aim = (nx: number, ny: number, on = true) => {
        x.target = clamp(nx, -1, 1);
        y.target = clamp(ny, -1, 1);
        light.target = on ? 1 : 0;
        slowUntil = 0;
        wake();
      };

      const aimAt = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        aim(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * 2 - 1
        );
      };

      const release = () => aim(0, 0, false);

      const onEnter = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') aimAt(event);
      };
      const onMove = (event: PointerEvent) => {
        if (event.pointerType === 'mouse' || event.pointerId === touchId)
          aimAt(event);
      };
      const onLeave = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') release();
      };
      const onDown = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') return;
        touchId = event.pointerId;
        aimAt(event);
      };
      const onUp = (event: PointerEvent) => {
        if (event.pointerId !== touchId) return;
        touchId = null;
        release();
      };

      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerleave', onLeave);
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);

      const observer = new ResizeObserver(() => {
        size.width = root.offsetWidth;
        size.height = root.offsetHeight;
        write();
      });
      observer.observe(root);

      engineRef.current = { aim, release, write };

      if (settingsRef.current.intro && !reduced) {
        x.p = 0.58;
        y.p = -0.5;
        light.p = 1;
        slowUntil = performance.now() + 1300;
        write();
        wake();
      } else {
        write();
      }

      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        root.removeEventListener('pointerenter', onEnter);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', onLeave);
        root.removeEventListener('pointerdown', onDown);
        root.removeEventListener('pointerup', onUp);
        root.removeEventListener('pointercancel', onUp);
        engineRef.current = null;
      };
    }, []);

    useEffect(() => {
      engineRef.current?.write();
    }, [enableTilt, tiltStrength, parallax]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root || !enableMobileTilt) return;

      let listening = false;
      const onOrientation = (event: DeviceOrientationEvent) => {
        if (event.beta == null || event.gamma == null) return;
        const sensitivity = settingsRef.current.mobileTiltSensitivity;
        engineRef.current?.aim(
          (event.gamma * sensitivity) / 150,
          ((event.beta - 20) * sensitivity) / 150
        );
      };
      const listen = () => {
        if (listening) return;
        listening = true;
        window.addEventListener('deviceorientation', onOrientation);
      };
      const onClick = () => {
        const Motion = window.DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<string>;
        };
        if (Motion && typeof Motion.requestPermission === 'function') {
          Motion.requestPermission()
            .then((state) => {
              if (state === 'granted') listen();
            })
            .catch(() => {});
        } else {
          listen();
        }
      };

      root.addEventListener('click', onClick);
      return () => {
        root.removeEventListener('click', onClick);
        window.removeEventListener('deviceorientation', onOrientation);
      };
    }, [enableMobileTilt]);

    const palette = theme === 'light' ? 'light' : 'dark';
    const foil = backdropColor
      ? (isDarkHex(backdropColor) ?? palette === 'dark')
        ? 'dark'
        : 'light'
      : palette;
    const backdrop = backdropColor
      ? `linear-gradient(180deg, color-mix(in srgb, ${backdropColor}, #ffffff 12%) 0%, color-mix(in srgb, ${backdropColor}, #000000 18%) 100%)`
      : 'var(--pc-tile)';

    const styleVars = {
      ...THEMES[palette],
      ...FOILS[foil],
      '--pc-radius': `${Math.max(0, radius)}px`,
      '--pc-backdrop': backdrop,
      '--pc-holo': clamp(holo, 0, 1),
      '--pc-glare': clamp(glare, 0, 1),
      '--pc-parallax': `${Math.max(0, parallax)}px`,
      '--pc-status': statusColor,
      '--pc-grain': GRAIN,
      '--pc-pattern': iconUrl
        ? `url("${iconUrl}")`
        : 'linear-gradient(#000, #000)',
      '--pc-pattern-size': iconUrl ? '140px 140px' : '100% 100%',
      '--pc-holo-gain': iconUrl ? 1.2 : 0.75,
      '--pc-holo-detail': iconUrl && foil === 'dark' ? 1 : 0,
    } as CSSProperties;

    return (
      <div
        ref={rootRef}
        className={`profile-card ${className}`.trim()}
        style={styleVars}
      >
        <div className="profile-card__body">
          <div className="profile-card__tile">
            <span className="profile-card__sheen" />
            <span className="profile-card__holo">
              <span className="profile-card__holo-glow" />
              <span className="profile-card__holo-shift" />
            </span>
            {avatarUrl && (
              <img
                className="profile-card__photo"
                src={avatarUrl}
                alt={name || ''}
                loading="lazy"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            )}
            {(name || title) && (
              <>
                <span className="profile-card__scrim" />
                <div className="profile-card__info">
                  {name && <h3 className="profile-card__name">{name}</h3>}
                  {title && <p className="profile-card__title">{title}</p>}
                </div>
              </>
            )}
            <span className="profile-card__tile-rim" />
          </div>

          {showUserInfo && (
            <div className="profile-card__footer">
              {miniAvatarUrl && (
                <span className="profile-card__avatar">
                  <img
                    src={miniAvatarUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                </span>
              )}
              <div className="profile-card__meta">
                {handle && (
                  <span className="profile-card__handle">@{handle}</span>
                )}
                {status && (
                  <span className="profile-card__status">{status}</span>
                )}
              </div>
              {contactText && (
                <button
                  type="button"
                  className="profile-card__contact"
                  onClick={onContactClick}
                  aria-label={name ? `${contactText} ${name}` : contactText}
                >
                  <Mail className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{contactText}</span>
                </button>
              )}
            </div>
          )}

          <span className="profile-card__glare" />
          <span className="profile-card__shade" />
          <span className="profile-card__rim" />
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
