'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useMotionSystem } from '../../context/MotionContext';

export interface TiltGlareCardProps extends React.HTMLAttributes<HTMLElement> {
  maxTiltDeg?: number;
  children: React.ReactNode;
}

/**
 * Subtle, professional 3D tilt & low-intensity foil sheen for Verified Certificates.
 * - Capped at ±4.5° by default to preserve institutional credibility.
 * - Disabled completely on touchscreens (`!finePointer`), `prefers-reduced-motion`, and `@media print`.
 * - Never wraps the printable certificate verification preview or QR export modal.
 */
export const TiltGlareCard: React.FC<TiltGlareCardProps> = ({
  maxTiltDeg = 4.5,
  className = '',
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const { finePointer, reducedMotion } = useMotionSystem();
  const enabled = finePointer && !reducedMotion;

  const cardRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef<{ rx: number; ry: number; gx: number; gy: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const applyTilt = useCallback(() => {
    rafRef.current = null;
    const node = cardRef.current;
    const t = targetRef.current;
    if (!node || !t) return;
    node.style.setProperty('--tilt-rx', `${t.rx.toFixed(2)}deg`);
    node.style.setProperty('--tilt-ry', `${t.ry.toFixed(2)}deg`);
    node.style.setProperty('--glare-x', `${t.gx.toFixed(1)}%`);
    node.style.setProperty('--glare-y', `${t.gy.toFixed(1)}%`);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseMove?.(e);
      if (!enabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(rect.width, 1)));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(rect.height, 1)));

      targetRef.current = {
        rx: (0.5 - ny) * maxTiltDeg * 2,
        ry: (nx - 0.5) * maxTiltDeg * 2,
        gx: nx * 100,
        gy: ny * 100,
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(applyTilt);
      }
    },
    [enabled, maxTiltDeg, applyTilt, onMouseMove]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseEnter?.(e);
      if (!enabled || !cardRef.current) return;
      cardRef.current.style.setProperty('--glare-opacity', '1');
    },
    [enabled, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(e);
      if (!enabled || !cardRef.current) return;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cardRef.current.style.setProperty('--tilt-rx', '0deg');
      cardRef.current.style.setProperty('--tilt-ry', '0deg');
      cardRef.current.style.setProperty('--glare-opacity', '0');
    },
    [enabled, onMouseLeave]
  );

  return (
    <article
      ref={cardRef}
      onMouseMove={enabled ? handleMouseMove : onMouseMove}
      onMouseEnter={enabled ? handleMouseEnter : onMouseEnter}
      onMouseLeave={enabled ? handleMouseLeave : onMouseLeave}
      className={`certificate-tilt-card relative overflow-hidden ${enabled ? 'certificate-tilt-card--enabled' : ''} ${className}`}
      {...rest}
    >
      {enabled && (
        <span
          aria-hidden="true"
          className="certificate-glare-layer pointer-events-none absolute inset-0 rounded-[inherit] no-print"
        />
      )}
      {children}
    </article>
  );
};
