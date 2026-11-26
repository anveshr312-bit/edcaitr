'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EDC_CONTOUR_PATHS, EDC_MARK_VIEWBOX } from './EdcMark';

interface Particle {
  x: number;
  y: number;
  tx: number; // target X (home coordinate on logo inside canvas)
  ty: number; // target Y (home coordinate on logo inside canvas)
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  noiseOffset: number;
}

const LOGO_HEX = '#BD011F';
const CANVAS_PADDING = 120; // 120px padding on all sides so particles move freely outside the logo box

export function FooterParticleLogo({
  className = 'w-20 sm:w-24',
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isHoveredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [isSwarming, setIsSwarming] = useState(false);
  const stateRef = useRef<'idle' | 'burst' | 'attract'>('idle');
  const timerRef = useRef<number>(0);
  const logoCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sample particles from the actual SVG contour paths onto target coordinates inside the padded canvas
  const initParticles = useCallback((logoW: number, logoH: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fullW = logoW + CANVAS_PADDING * 2;
    const fullH = logoH + CANVAS_PADDING * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.round(fullW * dpr);
    offscreen.height = Math.round(fullH * dpr);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // SVG viewBox: 0 0 1076 856
    const scale = Math.min(logoW / 1076, logoH / 856);
    const offsetX = CANVAS_PADDING + (logoW - 1076 * scale) / 2;
    const offsetY = CANVAS_PADDING + (logoH - 856 * scale) / 2;

    logoCenterRef.current = {
      x: CANVAS_PADDING + logoW / 2,
      y: CANVAS_PADDING + logoH / 2,
    };

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const pathMain = new Path2D(EDC_CONTOUR_PATHS.main);
    const pathUpper = new Path2D(EDC_CONTOUR_PATHS.eUpper);

    ctx.fillStyle = LOGO_HEX;
    ctx.fill(pathMain);
    ctx.fill(pathUpper);
    ctx.restore();

    // Sample pixel grid
    const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imgData.data;
    const particles: Particle[] = [];
    const step = Math.max(2, Math.floor(2.0 * dpr));

    for (let y = 0; y < offscreen.height; y += step) {
      for (let x = 0; x < offscreen.width; x += step) {
        const index = (y * offscreen.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 120) {
          const posX = x / dpr;
          const posY = y / dpr;
          particles.push({
            x: posX,
            y: posY,
            tx: posX,
            ty: posY,
            vx: 0,
            vy: 0,
            size: Math.random() * 0.5 + 1.25,
            alpha: 0.9 + Math.random() * 0.1,
            noiseOffset: Math.random() * 100,
          });
        }
      }
    }
    particlesRef.current = particles;
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const particles = particlesRef.current;
    timerRef.current += 0.018; // Slow, fluid time progression
    const t = timerRef.current;

    let totalMovement = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (stateRef.current === 'burst') {
        // Slow, graceful organic drifting without boundaries
        const noiseX = Math.sin(t * 1.8 + p.noiseOffset) * 0.22;
        const noiseY = Math.cos(t * 1.8 + p.noiseOffset) * 0.22;
        p.vx += noiseX;
        p.vy += noiseY;

        // Mild inward centering tension so particles billow organically
        p.vx += dx * 0.015;
        p.vy += dy * 0.015;

        // Viscous damping (slow and smooth, not fast or frantic)
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else {
        // 'attract' state: magnetic spring pull back to exact logo pixels
        const spring = 0.055;
        const damping = 0.84;

        p.vx += dx * spring;
        p.vy += dy * spring;
        p.vx *= damping;
        p.vy *= damping;
      }

      p.x += p.vx;
      p.y += p.vy;

      totalMovement += Math.abs(p.vx) + Math.abs(p.vy) + dist;

      // Draw particle in uniform brand logo color (#BD011F)
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = LOGO_HEX;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }

    ctx.restore();

    // Check if particles have magnetically re-assembled into the logo shape
    if (stateRef.current === 'attract' && totalMovement < particles.length * 0.22) {
      // Snapped back home! Morph transition complete
      setIsSwarming(false);
      stateRef.current = 'idle';
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const triggerScatter = useCallback(() => {
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const center = logoCenterRef.current;

    // Disperse particles outward from center with gentle, graceful velocity
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Radial angle pointing outward from logo center with slight curl
      const angle = Math.atan2(p.ty - center.y, p.tx - center.x) + (Math.random() - 0.5) * 0.9;
      // Gentle force (slow, floating dispersion, not high speed)
      const force = 1.2 + Math.random() * 2.4;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    }

    stateRef.current = 'burst';
    setIsSwarming(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    // After ~800ms of graceful billowing, magnetic field gathers particles back to morph into the logo
    setTimeout(() => {
      stateRef.current = 'attract';
    }, 850);
  }, [animate]);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    triggerScatter();
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const logoW = Math.round(rect.width) || 96;
      const logoH = Math.round(rect.height) || 76;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const fullW = logoW + CANVAS_PADDING * 2;
      const fullH = logoH + CANVAS_PADDING * 2;

      canvas.width = Math.round(fullW * dpr);
      canvas.height = Math.round(fullH * dpr);
      canvas.style.width = `${fullW}px`;
      canvas.style.height = `${fullH}px`;

      initParticles(logoW, logoH);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initParticles]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      className={`relative inline-block cursor-pointer select-none transition-transform hover:scale-[1.03] ${className}`}
      style={{ aspectRatio: '1076 / 856', overflow: 'visible' }}
    >
      {/* Crisp Static SVG (fades out as particles morph outward, fades back in as they settle) */}
      <svg
        viewBox={EDC_MARK_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        className={`h-full w-full transition-opacity duration-300 ${
          isSwarming ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        <path d={EDC_CONTOUR_PATHS.main} fill={LOGO_HEX} />
        <path d={EDC_CONTOUR_PATHS.eUpper} fill={LOGO_HEX} />
      </svg>

      {/* Expanded Particle Canvas: padded by CANVAS_PADDING on all sides with no bounding box */}
      <canvas
        ref={canvasRef}
        className={`absolute pointer-events-none transition-opacity duration-200 ${
          isSwarming ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'visible',
        }}
      />
    </div>
  );
}

export default FooterParticleLogo;
