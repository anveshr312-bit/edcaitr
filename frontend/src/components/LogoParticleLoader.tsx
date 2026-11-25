'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  angle: number;
  speed: number;
}

export default function LogoParticleLoader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1. Check if user already saw the intro in this session or prefers reduced motion
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem('edc_particle_intro_seen');

    if (reducedMotion || alreadySeen) {
      return;
    }

    setVisible(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let isCleanedUp = false;

    // Fail-safe timer: never trap the user for more than 2.4s
    const failSafeTimer = setTimeout(() => {
      finishAnimation();
    }, 2400);

    const finishAnimation = () => {
      setFading(true);
      sessionStorage.setItem('edc_particle_intro_seen', 'true');
      setTimeout(() => {
        setVisible(false);
      }, 550);
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.src = '/edc-logo-light.webp';
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCleanedUp) return;

      // Desired logo display size in center
      const maxW = Math.min(width * 0.7, 340);
      const aspect = img.height / img.width;
      const logoW = maxW;
      const logoH = maxW * aspect;

      // Sample pixels on an offscreen buffer
      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offscreen.width = logoW;
      offscreen.height = logoH;
      offCtx.drawImage(img, 0, 0, logoW, logoH);

      const imgData = offCtx.getImageData(0, 0, logoW, logoH).data;
      const particles: Particle[] = [];

      // Adaptive sampling step: 2px on desktop, 3.5px on mobile
      const step = width < 768 ? 3.5 : 2.2;
      const startX = (width - logoW) / 2;
      const startY = (height - logoH) / 2;

      for (let y = 0; y < logoH; y += step) {
        for (let x = 0; x < logoW; x += step) {
          const px = Math.floor(x);
          const py = Math.floor(y);
          const idx = (py * Math.floor(logoW) + px) * 4;
          const alpha = imgData[idx + 3];

          // If pixel is non-transparent
          if (alpha > 130) {
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            // Compute angle from logo center for outward swirling burst
            const centerX = startX + logoW / 2;
            const centerY = startY + logoH / 2;
            const posX = startX + x;
            const posY = startY + y;
            const dx = posX - centerX;
            const dy = posY - centerY;
            const baseAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
            const speed = Math.random() * 7 + 3;

            particles.push({
              x: posX,
              y: posY,
              originX: posX,
              originY: posY,
              vx: Math.cos(baseAngle) * speed,
              vy: Math.sin(baseAngle) * speed,
              color: `rgba(${r},${g},${b},`,
              size: Math.random() * 1.8 + 1.2,
              alpha: 1,
              angle: baseAngle,
              speed,
            });
          }
        }
      }

      const startTime = performance.now();
      const holdDuration = 420; // 0.42s intact
      const swarmDuration = 1100; // 1.1s explosion & swarm

      const render = (now: number) => {
        if (isCleanedUp) return;
        const elapsed = now - startTime;

        ctx.clearRect(0, 0, width, height);

        if (elapsed < holdDuration) {
          // Phase 1: Intact logo with micro-energy vibration
          const jitter = (elapsed / holdDuration) * 0.7;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const jx = (Math.random() - 0.5) * jitter;
            const jy = (Math.random() - 0.5) * jitter;
            ctx.fillStyle = `${p.color}1)`;
            ctx.beginPath();
            ctx.arc(p.originX + jx, p.originY + jy, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Phase 2: Dissect & Swarm outward
          const progress = (elapsed - holdDuration) / swarmDuration;
          const fadeProgress = Math.min(Math.max((progress - 0.5) / 0.5, 0), 1);

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Add swirling vortex force
            p.angle += 0.02;
            p.vx += Math.cos(p.angle) * 0.25;
            p.vy += Math.sin(p.angle) * 0.25;

            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Expand speed as it flies outward to fill the screen
            p.vx *= 1.025;
            p.vy *= 1.025;

            p.alpha = Math.max(0, 1 - fadeProgress * 1.1);

            if (p.alpha > 0.01) {
              ctx.fillStyle = `${p.color}${p.alpha})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * (1 + progress * 0.4), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        if (elapsed < holdDuration + swarmDuration) {
          animId = requestAnimationFrame(render);
        } else {
          finishAnimation();
        }
      };

      animId = requestAnimationFrame(render);
    };

    img.onerror = () => {
      // Fallback: exit cleanly if logo doesn't load
      finishAnimation();
    };

    return () => {
      isCleanedUp = true;
      clearTimeout(failSafeTimer);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#FAFAFC', // Studio Alabaster canvas
        opacity: fading ? 0 : 1,
        transition: 'opacity 550ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fading ? 'none' : 'auto',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'block',
        }}
      />
    </div>
  );
}
