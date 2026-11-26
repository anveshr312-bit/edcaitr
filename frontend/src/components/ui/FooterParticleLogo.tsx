'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EDC_CONTOUR_PATHS, EDC_MARK_VIEWBOX } from './EdcMark';

interface Particle {
  x: number;
  y: number;
  tx: number; // target X (home coordinate on logo)
  ty: number; // target Y (home coordinate on logo)
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  noiseOffset: number;
}

const PARTICLE_COLORS = [
  '#C01E30',
  '#BD011F',
  '#E11D48',
  '#E67C87',
  '#9E1625',
];

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

  // Sample particles from the actual SVG contour paths onto target coordinates
  const initParticles = useCallback((w: number, h: number) => {
    const offscreen = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    offscreen.width = w * dpr;
    offscreen.height = h * dpr;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Parse SVG viewBox: 0 0 1076 856
    const scale = Math.min(w / 1076, h / 856);
    const offsetX = (w - 1076 * scale) / 2;
    const offsetY = (h - 856 * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const pathMain = new Path2D(EDC_CONTOUR_PATHS.main);
    const pathUpper = new Path2D(EDC_CONTOUR_PATHS.eUpper);

    ctx.fillStyle = '#C01E30';
    ctx.fill(pathMain);
    ctx.fill(pathUpper);
    ctx.restore();

    // Sample pixel grid
    const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imgData.data;
    const particles: Particle[] = [];
    const step = Math.max(2, Math.floor(2.2 * dpr)); // crisp particle density

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
            size: Math.random() * 0.9 + 1.2,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            alpha: 0.85 + Math.random() * 0.15,
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
    timerRef.current += 0.05;
    const t = timerRef.current;

    let totalMovement = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Distance to target home position
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (stateRef.current === 'burst') {
        // Organic gentle swarm turbulence around displaced points
        const noiseX = Math.sin(t * 3 + p.noiseOffset) * 0.7;
        const noiseY = Math.cos(t * 3 + p.noiseOffset) * 0.7;
        p.vx += noiseX;
        p.vy += noiseY;

        // Soft magnetic pull starting even during swarm so they don't wander far
        p.vx += dx * 0.04;
        p.vy += dy * 0.04;

        // Damping
        p.vx *= 0.88;
        p.vy *= 0.88;
      } else {
        // 'attract' state: strong magnetic pull back to exact logo pixels
        const spring = 0.12;
        const damping = 0.78;

        p.vx += dx * spring;
        p.vy += dy * spring;
        p.vx *= damping;
        p.vy *= damping;
      }

      p.x += p.vx;
      p.y += p.vy;

      totalMovement += Math.abs(p.vx) + Math.abs(p.vy) + dist;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }

    ctx.restore();

    // Check if particles have gathered back into the logo shape
    if (stateRef.current === 'attract' && totalMovement < particles.length * 0.25) {
      // Snapped back home! Stop animation and show static crisp SVG
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

    // Disperse particles outward in a contained swarm radius (12px - 32px)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const angle = Math.random() * Math.PI * 2;
      // Controlled scatter: not too far, just a gentle swarm cloud around the logo
      const force = 4 + Math.random() * 8;
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
    }

    stateRef.current = 'burst';
    setIsSwarming(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    // After ~450ms of organic swarm, magnet attracts all particles back to rebuild the logo
    setTimeout(() => {
      stateRef.current = 'attract';
    }, 480);
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
      const w = Math.round(rect.width) || 96;
      const h = Math.round(rect.height) || 76;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      initParticles(w, h);
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
      className={`relative inline-block cursor-pointer select-none transition-transform hover:scale-[1.04] ${className}`}
      style={{ aspectRatio: '1076 / 856' }}
    >
      {/* Crisp Static SVG (visible when idle) */}
      <svg
        viewBox={EDC_MARK_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        className={`h-full w-full transition-opacity duration-200 ${
          isSwarming ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        <path d={EDC_CONTOUR_PATHS.main} fill="#BD011F" />
        <path d={EDC_CONTOUR_PATHS.eUpper} fill="#BD011F" />
      </svg>

      {/* Dynamic Particle Canvas (activates on hover swarm and magnet return) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
          isSwarming ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default FooterParticleLogo;
