'use client';

import { useEffect, useRef, useState } from 'react';

export default function LogoParticleLoader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  // 1. On client mount, check if user should see the intro
  useEffect(() => {
    try {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const alreadySeen = sessionStorage.getItem('edc_particle_intro_seen');
      if (!reducedMotion && !alreadySeen) {
        setActive(true);
      }
    } catch {
      // In case storage access is restricted
    }
  }, []);

  // 2. Once active is true, the canvas is mounted into the DOM
  useEffect(() => {
    if (!active) return;

    let animId: number;
    let isCleanedUp = false;

    const finish = () => {
      setFading(true);
      try {
        sessionStorage.setItem('edc_particle_intro_seen', 'true');
      } catch {}
      setTimeout(() => {
        setHidden(true);
      }, 500);
    };

    // Absolute fail-safe: never block the user for more than 2.2 seconds
    const hardTimeout = setTimeout(finish, 2200);

    const canvas = canvasRef.current;
    if (!canvas) {
      finish();
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      finish();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.src = '/edc-mark.png';

    img.onload = () => {
      if (isCleanedUp) return;

      const maxW = Math.min(width * 0.55, 260);
      const aspect = img.height / img.width;
      const logoW = maxW;
      const logoH = maxW * aspect;

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) {
        finish();
        return;
      }

      offscreen.width = logoW;
      offscreen.height = logoH;
      offCtx.drawImage(img, 0, 0, logoW, logoH);

      const imgData = offCtx.getImageData(0, 0, logoW, logoH).data;
      const particles: Array<{
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
      }> = [];

      const step = width < 768 ? 3.5 : 2.2;
      const startX = (width - logoW) / 2;
      const startY = (height - logoH) / 2;

      for (let y = 0; y < logoH; y += step) {
        for (let x = 0; x < logoW; x += step) {
          const px = Math.floor(x);
          const py = Math.floor(y);
          const idx = (py * Math.floor(logoW) + px) * 4;
          const alpha = imgData[idx + 3];

          if (alpha > 120) {
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            const centerX = startX + logoW / 2;
            const centerY = startY + logoH / 2;
            const posX = startX + x;
            const posY = startY + y;
            const dx = posX - centerX;
            const dy = posY - centerY;
            const baseAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
            const speed = Math.random() * 8 + 4;

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

      if (particles.length === 0) {
        finish();
        return;
      }

      const startTime = performance.now();
      const holdDuration = 450;
      const swarmDuration = 1050;

      const render = (now: number) => {
        if (isCleanedUp) return;
        const elapsed = now - startTime;

        ctx.clearRect(0, 0, width, height);

        if (elapsed < holdDuration) {
          const jitter = (elapsed / holdDuration) * 0.8;
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
          const progress = (elapsed - holdDuration) / swarmDuration;
          const fadeProgress = Math.min(Math.max((progress - 0.45) / 0.55, 0), 1);

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.angle += 0.02;
            p.vx += Math.cos(p.angle) * 0.3;
            p.vy += Math.sin(p.angle) * 0.3;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 1.025;
            p.vy *= 1.025;
            p.alpha = Math.max(0, 1 - fadeProgress * 1.15);

            if (p.alpha > 0.01) {
              ctx.fillStyle = `${p.color}${p.alpha})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * (1 + progress * 0.35), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        if (elapsed < holdDuration + swarmDuration) {
          animId = requestAnimationFrame(render);
        } else {
          finish();
        }
      };

      animId = requestAnimationFrame(render);
    };

    img.onerror = () => {
      finish();
    };

    return () => {
      isCleanedUp = true;
      clearTimeout(hardTimeout);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  if (!active || hidden) return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => {
        // Tap/click anywhere to skip immediately
        setFading(true);
        setTimeout(() => setHidden(true), 300);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#FAFAFC',
        opacity: fading ? 0 : 1,
        transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fading ? 'none' : 'auto',
        overflow: 'hidden',
        cursor: 'pointer',
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
