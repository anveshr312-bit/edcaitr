'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useMotionSystem } from '../../context/MotionContext';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'article' | 'div';
  children: React.ReactNode;
}

/**
 * Selective pointer-tracked hairline border & subtle surface spotlight.
 * - Strictly restricted to public Event cards and Startup Showcase cards.
 * - Automatically disabled on touch devices (`!finePointer`) and `prefers-reduced-motion`.
 * - Updates CSS variables via requestAnimationFrame with zero React re-renders on pointer move.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  as = 'article',
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
  const coordsRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const flushCoords = useCallback(() => {
    rafRef.current = null;
    const node = cardRef.current;
    const pt = coordsRef.current;
    if (!node || !pt) return;
    node.style.setProperty('--spot-x', `${pt.x.toFixed(1)}px`);
    node.style.setProperty('--spot-y', `${pt.y.toFixed(1)}px`);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseMove?.(e);
      if (!enabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      coordsRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushCoords);
      }
    },
    [enabled, flushCoords, onMouseMove]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseEnter?.(e);
      if (!enabled || !cardRef.current) return;
      cardRef.current.style.setProperty('--spot-opacity', '1');
    },
    [enabled, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(e);
      if (!enabled || !cardRef.current) return;
      cardRef.current.style.setProperty('--spot-opacity', '0');
    },
    [enabled, onMouseLeave]
  );

  const Tag = as;

  return (
    <Tag
      ref={cardRef as React.RefObject<never>}
      onMouseMove={enabled ? handleMouseMove : onMouseMove}
      onMouseEnter={enabled ? handleMouseEnter : onMouseEnter}
      onMouseLeave={enabled ? handleMouseLeave : onMouseLeave}
      className={`spotlight-card relative overflow-hidden ${enabled ? 'spotlight-card--active' : ''} ${className}`}
      {...rest}
    >
      {enabled && (
        <span
          aria-hidden="true"
          className="spotlight-card__glow pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
      {children}
    </Tag>
  );
};
