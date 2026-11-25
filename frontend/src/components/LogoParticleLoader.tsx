'use client';

import { useEffect, useRef, useState } from 'react';

// Exact vector contours extracted from the official EDC geometric emblem
const EMBLEM_PATH_0 =
  'M 21,281 L 22,284 L 263,285 L 265,283 L 261,265 L 251,243 L 230,216 L 207,198 L 187,188 L 154,181 L 114,184 L 87,195 L 64,210 L 42,233 L 29,258 Z';

const EMBLEM_PATH_1 =
  'M 123,22 L 123,128 L 120,134 L 122,140 L 120,151 L 125,156 L 189,155 L 189,116 L 193,114 L 220,124 L 242,136 L 261,150 L 279,167 L 296,188 L 315,223 L 321,241 L 320,245 L 323,249 L 323,258 L 325,260 L 324,267 L 327,275 L 326,296 L 328,298 L 328,309 L 326,316 L 327,329 L 323,343 L 22,343 L 23,356 L 31,375 L 43,394 L 58,411 L 80,427 L 102,437 L 104,436 L 108,439 L 114,438 L 119,441 L 127,440 L 133,443 L 151,442 L 154,440 L 160,441 L 185,434 L 203,426 L 223,412 L 244,389 L 248,379 L 252,376 L 305,376 L 313,378 L 313,383 L 310,386 L 303,405 L 288,429 L 280,435 L 279,440 L 273,448 L 244,475 L 199,499 L 191,499 L 191,472 L 189,466 L 191,457 L 189,450 L 182,453 L 172,453 L 170,455 L 162,454 L 147,457 L 124,456 L 121,458 L 122,591 L 147,590 L 150,588 L 159,589 L 166,586 L 181,585 L 187,582 L 191,583 L 196,580 L 200,581 L 203,578 L 217,576 L 224,572 L 245,566 L 271,554 L 295,540 L 327,517 L 344,498 L 351,494 L 352,489 L 357,485 L 376,459 L 398,481 L 416,495 L 440,509 L 447,510 L 460,517 L 463,516 L 482,523 L 509,525 L 511,527 L 533,527 L 536,525 L 543,526 L 545,524 L 554,525 L 563,522 L 564,526 L 571,520 L 580,519 L 585,516 L 588,517 L 591,514 L 613,507 L 644,490 L 677,460 L 697,435 L 708,414 L 713,409 L 716,398 L 719,396 L 727,375 L 727,366 L 633,366 L 616,396 L 588,423 L 553,439 L 549,438 L 543,441 L 516,441 L 488,433 L 470,423 L 444,399 L 422,368 L 421,361 L 416,353 L 417,348 L 412,332 L 412,305 L 415,303 L 413,297 L 415,295 L 414,289 L 417,285 L 416,281 L 421,272 L 422,265 L 438,237 L 459,216 L 474,206 L 501,194 L 509,193 L 510,195 L 514,195 L 517,190 L 554,190 L 559,193 L 569,194 L 572,197 L 584,201 L 600,212 L 615,227 L 627,243 L 633,258 L 638,261 L 641,259 L 729,259 L 721,231 L 701,192 L 678,162 L 648,135 L 613,114 L 584,104 L 550,98 L 522,98 L 488,104 L 460,114 L 416,141 L 395,158 L 391,164 L 387,165 L 371,140 L 371,137 L 351,110 L 313,74 L 283,54 L 258,42 L 228,32 L 225,33 L 221,30 L 217,31 L 212,28 L 208,29 L 190,24 L 184,25 L 176,22 L 165,23 L 151,20 L 125,20 Z';

const EMBLEM_VIEWBOX_W = 750;
const EMBLEM_VIEWBOX_H = 612;

// Fast deterministic 2D pseudo-Perlin noise implementation for curl-noise
const PERM = new Uint8Array(512);
const P_INIT = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21,
  10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149,
  56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
  132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
  250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223,
  183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108,
  110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162,
  241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45,
  127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];
for (let i = 0; i < 256; i++) {
  PERM[i] = P_INIT[i];
  PERM[i + 256] = P_INIT[i];
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}
function grad(hash: number, x: number, y: number) {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}
function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const a = PERM[X] + Y;
  const aa = PERM[a];
  const ab = PERM[a + 1];
  const b = PERM[X + 1] + Y;
  const ba = PERM[b];
  const bb = PERM[b + 1];
  return lerp(v, lerp(u, grad(PERM[aa], xf, yf), grad(PERM[ba], xf - 1, yf)), lerp(u, grad(PERM[ab], xf, yf - 1), grad(PERM[bb], xf - 1, yf - 1)));
}

// True divergence-free curl noise
function curlNoise2D(x: number, y: number, t: number) {
  const eps = 0.35;
  const n1 = noise2D(x, y + eps + t);
  const n2 = noise2D(x, y - eps + t);
  const n3 = noise2D(x + eps + t, y);
  const n4 = noise2D(x - eps + t, y);
  return {
    vx: (n1 - n2) / (2 * eps),
    vy: -(n3 - n4) / (2 * eps),
  };
}

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  dissolveOffset: number;
  speedMultiplier: number;
  streamPhase: number;
}

export default function LogoParticleLoader() {
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const path0Ref = useRef<SVGPathElement | null>(null);
  const path1Ref = useRef<SVGPathElement | null>(null);
  const waveBackRef = useRef<SVGPathElement | null>(null);
  const waveFrontRef = useRef<SVGPathElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Session check & accessibility check
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem('edc_cinematic_intro_seen');

    if (reducedMotion || alreadySeen) {
      setCompleted(true);
      return;
    }

    setActive(true);
  }, []);

  useEffect(() => {
    if (!active || completed) return;

    let animId: number;
    let isCleanedUp = false;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    const p0 = path0Ref.current;
    const p1 = path1Ref.current;
    const wBack = waveBackRef.current;
    const wFront = waveFrontRef.current;
    const container = containerRef.current;
    const svgEl = svgRef.current;

    // Fail-safe dismissal (guarantees site is visible within 4.2 seconds under all conditions)
    const failSafeTimer = setTimeout(() => {
      finishTransition();
    }, 4200);

    const finishTransition = () => {
      if (isCleanedUp) return;
      try {
        sessionStorage.setItem('edc_cinematic_intro_seen', 'true');
      } catch {}
      setCompleted(true);
    };

    // Calculate dimensions
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (canvas && ctx) {
      canvas.width = winW * dpr;
      canvas.height = winH * dpr;
      ctx.scale(dpr, dpr);
    }

    // Geometry position on screen
    const maxLogoW = Math.min(winW * 0.54, 280);
    const aspect = EMBLEM_VIEWBOX_H / EMBLEM_VIEWBOX_W;
    const logoW = maxLogoW;
    const logoH = maxLogoW * aspect;
    const logoX = (winW - logoW) / 2;
    const logoY = (winH - logoH) / 2;
    const logoCenterX = logoX + logoW / 2;
    const logoCenterY = logoY + logoH / 2;

    // Outline path measurements
    const len0 = p0?.getTotalLength() || 620;
    const len1 = p1?.getTotalLength() || 3400;

    if (p0) {
      p0.style.strokeDasharray = `${len0}`;
      p0.style.strokeDashoffset = `${len0}`;
    }
    if (p1) {
      p1.style.strokeDasharray = `${len1}`;
      p1.style.strokeDashoffset = `${len1}`;
    }

    // --- PRECOMPUTE PARTICLES VIA OFFSCREEN CANVAS ---
    const particles: Particle[] = [];
    const isMobile = winW < 768;
    const targetParticleCount = isMobile ? 3200 : 6400;

    const offscreen = document.createElement('canvas');
    offscreen.width = EMBLEM_VIEWBOX_W;
    offscreen.height = EMBLEM_VIEWBOX_H;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    if (offCtx) {
      const p2d0 = new Path2D(EMBLEM_PATH_0);
      const p2d1 = new Path2D(EMBLEM_PATH_1);
      offCtx.fillStyle = '#C01E30';
      offCtx.fill(p2d0, 'evenodd');
      offCtx.fill(p2d1, 'evenodd');

      const imgData = offCtx.getImageData(0, 0, EMBLEM_VIEWBOX_W, EMBLEM_VIEWBOX_H).data;
      const opaquePoints: [number, number][] = [];

      for (let y = 0; y < EMBLEM_VIEWBOX_H; y += 2) {
        for (let x = 0; x < EMBLEM_VIEWBOX_W; x += 2) {
          const idx = (y * EMBLEM_VIEWBOX_W + x) * 4;
          if (imgData[idx + 3] > 128) {
            opaquePoints.push([x, y]);
          }
        }
      }

      const totalOpaque = opaquePoints.length;
      const stride = Math.max(1, Math.floor(totalOpaque / targetParticleCount));

      for (let i = 0; i < totalOpaque; i += stride) {
        if (particles.length >= targetParticleCount) break;
        const [vx, vy] = opaquePoints[i];
        const screenX = logoX + (vx / EMBLEM_VIEWBOX_W) * logoW;
        const screenY = logoY + (vy / EMBLEM_VIEWBOX_H) * logoH;

        // Spatial coherent noise for organic dissolution peeling
        const dissolveSeed = (noise2D(vx * 0.015, vy * 0.015) + 1) * 0.5;

        particles.push({
          originX: screenX,
          originY: screenY,
          x: screenX,
          y: screenY,
          vx: 0,
          vy: 0,
          size: Math.random() * 0.8 + (isMobile ? 0.9 : 0.75),
          alpha: 1,
          dissolveOffset: dissolveSeed * 0.32,
          speedMultiplier: Math.random() * 0.6 + 0.7,
          streamPhase: Math.random() * Math.PI * 2,
        });
      }
    }

    // --- TIMELINE ORCHESTRATION ---
    const startTime = performance.now();

    const loop = (currentTime: number) => {
      if (isCleanedUp) return;
      const elapsed = (currentTime - startTime) / 1000; // seconds

      // ==========================================
      // STAGE 1: PRECISION OUTLINE (0.0s – 0.8s)
      // ==========================================
      if (elapsed <= 0.85) {
        const t1 = Math.min(elapsed / 0.8, 1);
        // Easing: cubic-bezier(0.25, 1, 0.5, 1)
        const ease1 = 1 - Math.pow(1 - t1, 3);

        if (p0) p0.style.strokeDashoffset = `${len0 * (1 - ease1)}`;
        if (p1) p1.style.strokeDashoffset = `${len1 * (1 - ease1)}`;
      } else {
        if (p0) p0.style.strokeDashoffset = '0';
        if (p1) p1.style.strokeDashoffset = '0';
      }

      // ==========================================
      // STAGE 2: ORGANIC LIQUID INFUSION (0.8s – 1.8s)
      // ==========================================
      if (elapsed >= 0.8 && elapsed <= 1.85) {
        const t2 = Math.min((elapsed - 0.8) / 1.0, 1);
        // Smooth sine ease in-out
        const fillProgress = 0.5 - 0.5 * Math.cos(t2 * Math.PI);

        // Fluid rises from bottom (620) to top (-10)
        const waterY = EMBLEM_VIEWBOX_H * (1 - fillProgress);

        // Amplitude dampens to exactly 0 as it hits the top
        const amp = Math.sin(t2 * Math.PI) * 24 * (1 - Math.pow(t2, 2));
        const phase = elapsed * 7.5;

        // Generate back wave
        let dBack = `M -30 ${waterY} `;
        for (let x = -30; x <= EMBLEM_VIEWBOX_W + 30; x += 30) {
          const wy = waterY + Math.sin(x * 0.016 + phase + 1.8) * amp * 0.85;
          dBack += `L ${x.toFixed(1)} ${wy.toFixed(1)} `;
        }
        dBack += `L ${EMBLEM_VIEWBOX_W + 30} ${EMBLEM_VIEWBOX_H + 30} L -30 ${EMBLEM_VIEWBOX_H + 30} Z`;
        if (wBack) wBack.setAttribute('d', dBack);

        // Generate front wave
        let dFront = `M -30 ${waterY} `;
        for (let x = -30; x <= EMBLEM_VIEWBOX_W + 30; x += 25) {
          const wy = waterY + Math.sin(x * 0.02 + phase) * amp;
          dFront += `L ${x.toFixed(1)} ${wy.toFixed(1)} `;
        }
        dFront += `L ${EMBLEM_VIEWBOX_W + 30} ${EMBLEM_VIEWBOX_H + 30} L -30 ${EMBLEM_VIEWBOX_H + 30} Z`;
        if (wFront) wFront.setAttribute('d', dFront);

        // Fade out outline stroke as solid fill finishes (1.6s to 1.8s)
        if (elapsed >= 1.6) {
          const strokeAlpha = Math.max(0, 1 - (elapsed - 1.6) / 0.2);
          if (p0) p0.style.strokeOpacity = `${strokeAlpha}`;
          if (p1) p1.style.strokeOpacity = `${strokeAlpha}`;
        }
      } else if (elapsed > 1.85) {
        // Perfectly solid, flat fill achieved
        if (wFront) {
          wFront.setAttribute(
            'd',
            `M -30 -30 L ${EMBLEM_VIEWBOX_W + 30} -30 L ${EMBLEM_VIEWBOX_W + 30} ${EMBLEM_VIEWBOX_H + 30} L -30 ${EMBLEM_VIEWBOX_H + 30} Z`
          );
        }
        if (wBack) wBack.style.display = 'none';
        if (p0) p0.style.strokeOpacity = '0';
        if (p1) p1.style.strokeOpacity = '0';
      }

      // ==========================================
      // STAGE 3: BRAND RECOGNITION HOLD (1.8s – 2.1s)
      // (Logo remains completely still, solid, and pristine)
      // ==========================================

      // ==========================================
      // STAGE 4 & 5: DISSOLUTION & ORGANIC SWARM (2.1s – 3.2s)
      // ==========================================
      if (elapsed >= 2.1 && ctx) {
        ctx.clearRect(0, 0, winW, winH);

        // Crossfade: hide SVG smoothly as particles take over (2.1s to 2.25s)
        if (svgEl && elapsed >= 2.1) {
          const svgAlpha = Math.max(0, 1 - (elapsed - 2.1) / 0.16);
          svgEl.style.opacity = `${svgAlpha}`;
        }

        const swarmTime = elapsed - 2.1;
        const noiseScale = 0.0035;
        const timeSpeed = 0.55;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Particle waits for its coherent dissolution threshold
          if (swarmTime < p.dissolveOffset) {
            // Draw particle pinned at origin
            ctx.fillStyle = 'rgba(192, 30, 48, 1)';
            ctx.beginPath();
            ctx.arc(p.originX, p.originY, p.size, 0, Math.PI * 2);
            ctx.fill();
            continue;
          }

          // Active particle moving in fluid flow field
          const life = swarmTime - p.dissolveOffset;

          // Outward radial direction from logo center
          const dx = p.x - logoCenterX;
          const dy = p.y - logoCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const radX = dx / dist;
          const radY = dy / dist;

          // Curl noise sample (divergence-free stream)
          const curl = curlNoise2D(p.x * noiseScale, p.y * noiseScale, elapsed * timeSpeed);

          // Acceleration curve: starts subtle, accelerates smoothly, then coasts
          const speedRamp = Math.min(life * 4.2, 1);
          const currentSpeed = (2.8 + life * 4.5) * p.speedMultiplier * speedRamp;

          // Combine curl noise (65%) with outward expansion (35%)
          const targetVx = (curl.vx * 0.65 + radX * 0.35) * currentSpeed;
          const targetVy = (curl.vy * 0.65 + radY * 0.35) * currentSpeed;

          // Fluid inertia smoothing
          p.vx += (targetVx - p.vx) * 0.12;
          p.vy += (targetVy - p.vy) * 0.12;

          p.x += p.vx;
          p.y += p.vy;

          // Fade out as swarm expands past 2.9s
          if (elapsed > 2.85) {
            const fadeLife = Math.max(0, 1 - (elapsed - 2.85) / 0.7);
            p.alpha = fadeLife;
          }

          if (p.alpha > 0.02) {
            ctx.fillStyle = `rgba(192, 30, 48, ${p.alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ==========================================
      // STAGE 6: CINEMATIC HOMEPAGE REVEAL (2.8s – 3.6s)
      // ==========================================
      if (elapsed >= 2.8 && container) {
        const revealProgress = Math.min((elapsed - 2.8) / 0.75, 1);
        // Ease out quad
        const easedReveal = 1 - Math.pow(1 - revealProgress, 2.2);
        const radius = easedReveal * 145; // expands to 145% to cover corners

        container.style.maskImage = `radial-gradient(circle at center, transparent ${radius.toFixed(1)}%, black ${(radius + 28).toFixed(1)}%)`;
        container.style.webkitMaskImage = `radial-gradient(circle at center, transparent ${radius.toFixed(1)}%, black ${(radius + 28).toFixed(1)}%)`;
      }

      // Completion check
      if (elapsed < 3.65) {
        animId = requestAnimationFrame(loop);
      } else {
        finishTransition();
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      isCleanedUp = true;
      clearTimeout(failSafeTimer);
      cancelAnimationFrame(animId);
    };
  }, [active, completed]);

  if (!active || completed) return null;

  return (
    <>
      {/* ─── 1. BLACK CINEMATIC BACKDROP WITH RADIAL REVEAL MASK ─── */}
      <div
        ref={containerRef}
        aria-hidden="true"
        onClick={() => {
          // Fast-forward on tap/click
          sessionStorage.setItem('edc_cinematic_intro_seen', 'true');
          setCompleted(true);
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99990,
          backgroundColor: '#080808', // Precision obsidian black
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
          willChange: 'mask-image, -webkit-mask-image',
        }}
      >
        {/* ─── 2. CENTERED SVG EMBLEM (STAGES 1, 2, 3) ─── */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${EMBLEM_VIEWBOX_W} ${EMBLEM_VIEWBOX_H}`}
          style={{
            width: 'min(54vw, 280px)',
            height: 'auto',
            display: 'block',
            overflow: 'visible',
            willChange: 'opacity',
          }}
        >
          <defs>
            <clipPath id="edc-emblem-clip">
              <path d={`${EMBLEM_PATH_0} ${EMBLEM_PATH_1}`} clipRule="evenodd" />
            </clipPath>
          </defs>

          {/* Liquid Infusion Layers (Strictly clipped inside emblem boundaries) */}
          <g clipPath="url(#edc-emblem-clip)">
            {/* Deep crimson wave */}
            <path ref={waveBackRef} fill="#8A1420" d="" />
            {/* Signature official crimson wave */}
            <path ref={waveFrontRef} fill="#C01E30" d="" />
          </g>

          {/* Precision Outline Stroke Layers */}
          <path
            ref={path0Ref}
            d={EMBLEM_PATH_0}
            fill="none"
            stroke="#C01E30"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            ref={path1Ref}
            d={EMBLEM_PATH_1}
            fill="none"
            stroke="#C01E30"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ─── 3. TRANSPARENT PARTICLE SWARM CANVAS (STAGES 4, 5, 6) ─── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          width: '100vw',
          height: '100vh',
          display: 'block',
        }}
      />
    </>
  );
}
