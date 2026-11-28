'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface MinimalGridBackgroundProps {
  /** Grid pattern style: 'grid' (hairline lines) or 'dots' (minimal dot matrix) */
  variant?: 'grid' | 'dots';
  /** Grid cell size in px (default 48) */
  size?: number;
  /** Whether to show a very subtle cursor-follow spotlight (default true) */
  interactive?: boolean;
  className?: string;
}

/**
 * MinimalGridBackground
 * 
 * An ultra-clean, minimal, institutional background designed for professional
 * university / incubator portals. Replaces heavy 3D wave meshes with:
 * 1. Quiet, hairline architectural grid lines / dot matrix (3-5% opacity).
 * 2. Soft radial vignette mask that fades the grid out towards the center & bottom.
 * 3. Delicate top ambient glow matching EDC brand vermilion (#C01E30).
 * 4. Butter-smooth, whisper-quiet cursor spotlight (zero GPU/WebGL overhead).
 */
export function MinimalGridBackground({
  variant = 'grid',
  size = 48,
  interactive = true,
  className = '',
}: MinimalGridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!interactive) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isHovering) setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setMousePos(null);
    };

    const updatePosition = () => {
      // Lerp for butter-smooth motion
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      setMousePos({ x: Math.round(currentX), y: Math.round(currentY) });
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [interactive, isHovering]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* ── 1. Delicate Top Ambient Brand Glow ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[520px] max-w-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% -5%, rgba(192, 30, 48, 0.045), transparent 75%)',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[380px] max-w-full pointer-events-none dark:opacity-70 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(192, 30, 48, 0.03), transparent 70%)',
        }}
      />

      {/* ── 2. Subtle Base Hairline Pattern ── */}
      {variant === 'grid' ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border-hairline) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)
            `,
            backgroundSize: `${size}px ${size}px`,
            // Vignette mask: gently present near top hero, completely dissolves down page
            maskImage:
              'radial-gradient(ellipse 85% 60% at 50% 0%, black 15%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 60% at 50% 0%, black 15%, transparent 80%)',
            opacity: 0.65,
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--border-hairline) 1px, transparent 1px)',
            backgroundSize: `${size}px ${size}px`,
            maskImage:
              'radial-gradient(ellipse 85% 60% at 50% 0%, black 15%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 60% at 50% 0%, black 15%, transparent 80%)',
            opacity: 0.75,
          }}
        />
      )}

      {/* ── 3. Subtle Interactive Cursor Spotlight (Whisper-Quiet) ── */}
      {interactive && mousePos && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: isHovering ? 1 : 0,
            background: `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, rgba(192, 30, 48, 0.035), transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

export default MinimalGridBackground;
