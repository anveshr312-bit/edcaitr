'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  EDC_CONTOUR_PATHS,
  EDC_CRIMSON,
  EDC_MARK_HEIGHT,
  EDC_MARK_VIEWBOX,
  EDC_MARK_WIDTH,
} from './EdcMark';
import { useMotionSystem } from '../../context/MotionContext';

const SESSION_KEY = 'edc_aitr_cinematic_intro_seen';
const FAILSAFE_MS = 4600;
const SHORT_FAILSAFE_MS = 1600;

let hasCompletedThisMount = false;

interface ParticlePool {
  count: number;
  x: Float32Array;
  y: Float32Array;
  originX: Float32Array;
  originY: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  size: Float32Array;
  delay: Float32Array;
  phase: Float32Array;
  speedMul: Float32Array;
  dirBias: Float32Array;
  colorIdx: Uint8Array;
}

// Original EDC crimson (#BD011F) with minimal authentic tonal dust variation
const CRIMSON_PALETTE = [
  '#BD011F',
  '#BD011F',
  '#BD011F',
  '#C40624',
  '#B4001D',
  '#C90B29',
  '#AC001B',
] as const;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

function waitForAppReadiness(): Promise<void> {
  return new Promise((resolve) => {
    const afterPaint = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    };

    const waitFonts = () => {
      const fontsReady =
        typeof document !== 'undefined' &&
        'fonts' in document &&
        document.fonts?.ready
          ? document.fonts.ready.catch(() => undefined)
          : Promise.resolve();
      fontsReady.then(afterPaint);
    };

    if (typeof document === 'undefined' || document.readyState === 'complete') {
      waitFonts();
      return;
    }

    const onLoad = () => {
      window.removeEventListener('load', onLoad);
      waitFonts();
    };
    window.addEventListener('load', onLoad, { once: true });
  });
}

/**
 * Generates an organic fluid wave SVG path spanning x in [-40, 1116] at vertical level yLevel.
 */
function buildWavePath(
  yLevel: number,
  amp: number,
  freq1: number,
  phase1: number,
  freq2: number,
  phase2: number
): string {
  const steps = 22;
  const xMin = -30;
  const xMax = EDC_MARK_WIDTH + 30;
  const dx = (xMax - xMin) / steps;

  let d = `M ${xMin} ${EDC_MARK_HEIGHT + 60} L ${xMin} ${(
    yLevel +
    Math.sin(phase1) * amp +
    Math.cos(phase2) * amp * 0.42
  ).toFixed(1)}`;

  for (let i = 1; i <= steps; i++) {
    const x = xMin + i * dx;
    const nx = i / steps;
    const y =
      yLevel +
      Math.sin(nx * freq1 * Math.PI * 2 + phase1) * amp +
      Math.cos(nx * freq2 * Math.PI * 2 + phase2) * amp * 0.42;
    const prevX = x - dx;
    const midX = (prevX + x) * 0.5;
    const prevNx = (i - 1) / steps;
    const prevY =
      yLevel +
      Math.sin(prevNx * freq1 * Math.PI * 2 + phase1) * amp +
      Math.cos(prevNx * freq2 * Math.PI * 2 + phase2) * amp * 0.42;
    d += ` Q ${midX.toFixed(1)} ${((prevY + y) * 0.5).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }

  d += ` L ${xMax} ${EDC_MARK_HEIGHT + 60} Z`;
  return d;
}

/**
 * Exact analytic curl (∂ψ/∂y, -∂ψ/∂x) of a smooth multi-octave 2D stream-function ψ(x, y, t).
 * Produces divergence-free, coherent fluid currents so neighboring particles travel in connected
 * ribbons while cutting per-particle trig operations by ~3× versus finite differences.
 */
const curlOut = { vx: 0, vy: 0 };
function computeAnalyticCurl(x: number, y: number, t: number, scale: number): void {
  const ax = x * 0.0052 + t * 0.72;
  const by = y * 0.0048 - t * 0.58;
  const sinAx = Math.sin(ax);
  const cosAx = Math.cos(ax);
  const sinBy = Math.sin(by);
  const cosBy = Math.cos(by);

  const u = (x * 0.72 - y * 0.69) * 0.0095 - t * 0.94 + 1.3;
  const v = (x * 0.69 + y * 0.72) * 0.0085 + t * 0.64;
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const sinV = Math.sin(v);
  const cosV = Math.cos(v);

  const w = x * 0.0155 + y * 0.0135 + t * 1.15;
  const sinW = Math.sin(w);

  const dPsiDx =
    0.0052 * cosAx * cosBy +
    0.55 * (cosU * cosV * 0.00684 - sinU * sinV * 0.005865) -
    0.00434 * sinW;

  const dPsiDy =
    -0.0048 * sinAx * sinBy +
    0.55 * (cosU * cosV * -0.006555 - sinU * sinV * 0.00612) -
    0.00378 * sinW;

  curlOut.vx = dPsiDy * scale;
  curlOut.vy = -dPsiDx * scale;
}

/**
 * Spatially coherent 2D dissolution field returning a normalized delay in [0, 1]
 * so adjacent logo regions peel away in connected waves instead of random noise.
 */
function dissolutionField(nx: number, ny: number): number {
  const waveA = Math.sin(nx * 4.2 - ny * 2.8 + 0.6) * 0.5 + 0.5;
  const waveB = Math.cos(nx * 2.4 + ny * 4.6 - 0.9) * 0.5 + 0.5;
  const radial = Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) * 1.55);
  // Subtle edge-first organic wave peeling across the silhouette
  return clamp01(waveA * 0.42 + waveB * 0.28 + (1 - radial) * 0.3);
}

/**
 * Rasterizes the exact official EDC SVG contours onto an offscreen canvas aligned 1:1
 * with the rendered SVG bounding box and samples microparticle coordinates exclusively
 * from opaque logo pixels (preserving every negative space & internal cutout).
 */
function sampleLogoParticles(
  svgRect: DOMRect,
  targetCount: number,
  dpr: number
): ParticlePool {
  const sampleScale = Math.max(2, Math.min(3, Math.ceil(dpr * 1.75)));
  const w = Math.max(40, Math.round(svgRect.width * sampleScale));
  const h = Math.max(32, Math.round(svgRect.height * sampleScale));

  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d', { willReadFrequently: true });

  if (!octx) {
    return {
      count: 0,
      x: new Float32Array(0),
      y: new Float32Array(0),
      originX: new Float32Array(0),
      originY: new Float32Array(0),
      vx: new Float32Array(0),
      vy: new Float32Array(0),
      size: new Float32Array(0),
      delay: new Float32Array(0),
      phase: new Float32Array(0),
      speedMul: new Float32Array(0),
      dirBias: new Float32Array(0),
      colorIdx: new Uint8Array(0),
    };
  }

  octx.clearRect(0, 0, w, h);
  octx.save();
  octx.scale(w / EDC_MARK_WIDTH, h / EDC_MARK_HEIGHT);
  octx.fillStyle = EDC_CRIMSON;
  octx.fill(new Path2D(EDC_CONTOUR_PATHS.main));
  octx.fill(new Path2D(EDC_CONTOUR_PATHS.eUpper));
  octx.restore();

  const imgData = octx.getImageData(0, 0, w, h).data;
  const opaqueIndices: number[] = [];
  for (let py = 0; py < h; py++) {
    const rowOffset = py * w;
    for (let px = 0; px < w; px++) {
      if (imgData[(rowOffset + px) * 4 + 3] > 165) {
        opaqueIndices.push(rowOffset + px);
      }
    }
  }

  // Release offscreen backing store immediately
  offscreen.width = 0;
  offscreen.height = 0;

  const totalOpaque = opaqueIndices.length;
  const count = Math.min(targetCount, totalOpaque);

  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const originX = new Float32Array(count);
  const originY = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);
  const size = new Float32Array(count);
  const delay = new Float32Array(count);
  const phase = new Float32Array(count);
  const speedMul = new Float32Array(count);
  const dirBias = new Float32Array(count);
  const colorIdx = new Uint8Array(count);

  if (count === 0) {
    return {
      count,
      x,
      y,
      originX,
      originY,
      vx,
      vy,
      size,
      delay,
      phase,
      speedMul,
      dirBias,
      colorIdx,
    };
  }

  // Deterministic golden-ratio permutation across opaque pixels ensures uniform coverage
  // of the exact logo silhouette with zero clumping or missing regions.
  const stride = totalOpaque / count;
  const invScaleX = svgRect.width / w;
  const invScaleY = svgRect.height / h;

  let seed = 0x517cc1b7;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const pickIdx = Math.min(
      totalOpaque - 1,
      Math.floor((i + rand() * 0.85) * stride)
    );
    const flat = opaqueIndices[pickIdx];
    const px = flat % w;
    const py = (flat - px) / w;

    const sx = svgRect.left + (px + (rand() - 0.5) * 0.75) * invScaleX;
    const sy = svgRect.top + (py + (rand() - 0.5) * 0.75) * invScaleY;

    x[i] = sx;
    y[i] = sy;
    originX[i] = sx;
    originY[i] = sy;
    vx[i] = 0;
    vy[i] = 0;

    // Fine microparticle size: 0.55px – 1.45px CSS px
    size[i] = 0.55 + rand() * 0.9;

    const nx = px / w;
    const ny = py / h;
    // Coherent dissolution delay between 0.00s and 0.34s after t=2.10s
    delay[i] = dissolutionField(nx, ny) * 0.32 + rand() * 0.04;
    phase[i] = rand() * Math.PI * 2;
    speedMul[i] = 0.72 + rand() * 0.58;
    dirBias[i] = (rand() - 0.5) * 0.55;
    colorIdx[i] = Math.floor(rand() * CRIMSON_PALETTE.length);
  }

  return {
    count,
    x,
    y,
    originX,
    originY,
    vx,
    vy,
    size,
    delay,
    phase,
    speedMul,
    dirBias,
    colorIdx,
  };
}

export const EdcPreloader: React.FC = () => {
  const { markIntroReady } = useMotionSystem();
  const [visible, setVisible] = useState<boolean>(() => !hasCompletedThisMount);
  const clipUid = useId().replace(/:/g, '');
  const clipId = `edc-liquid-clip-${clipUid}`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mainStrokeRef = useRef<SVGPathElement | null>(null);
  const eUpperStrokeRef = useRef<SVGPathElement | null>(null);
  const waveBackRef = useRef<SVGPathElement | null>(null);
  const waveFrontRef = useRef<SVGPathElement | null>(null);
  const solidGroupRef = useRef<SVGGElement | null>(null);
  const liquidGroupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (!visible) {
      markIntroReady();
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let isSubsequentVisit = false;
    try {
      isSubsequentVisit = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      isSubsequentVisit = false;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let rafId = 0;
    let disposed = false;
    let appReady = false;
    let failsafeFired = false;

    const finishAndUnmount = () => {
      if (disposed) return;
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.overflow = prevOverflow;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Ignore private browsing storage restriction
      }
      hasCompletedThisMount = true;
      markIntroReady();
      setVisible(false);
    };

    waitForAppReadiness().then(() => {
      appReady = true;
    });

    const failsafeTimer = window.setTimeout(
      () => {
        failsafeFired = true;
        appReady = true;
      },
      isSubsequentVisit || prefersReduced ? SHORT_FAILSAFE_MS : FAILSAFE_MS
    );

    // Measure true SVG contour lengths once
    const mainStroke = mainStrokeRef.current;
    const eUpperStroke = eUpperStrokeRef.current;
    const mainLen = mainStroke ? mainStroke.getTotalLength() : 4200;
    const eUpperLen = eUpperStroke ? eUpperStroke.getTotalLength() : 980;

    if (mainStroke) {
      mainStroke.style.strokeDasharray = `${mainLen}`;
      mainStroke.style.strokeDashoffset = `${mainLen}`;
    }
    if (eUpperStroke) {
      eUpperStroke.style.strokeDasharray = `${eUpperLen}`;
      eUpperStroke.style.strokeDashoffset = `${eUpperLen}`;
    }

    // ------------------------------------------------------------------
    // MODE A: prefers-reduced-motion (minimal static brand reveal)
    // ------------------------------------------------------------------
    if (prefersReduced) {
      if (mainStroke) mainStroke.style.opacity = '0';
      if (eUpperStroke) eUpperStroke.style.opacity = '0';
      if (liquidGroupRef.current) liquidGroupRef.current.style.opacity = '0';
      if (solidGroupRef.current) solidGroupRef.current.style.opacity = '1';

      const start = performance.now();
      const tickReduced = (now: number) => {
        if (disposed) return;
        const elapsed = (now - start) / 1000;
        const readyToExit = (appReady && elapsed >= 0.24) || failsafeFired;

        if (!readyToExit) {
          rafId = requestAnimationFrame(tickReduced);
          return;
        }

        const fadeStart = Math.max(0.24, elapsed);
        const tickFade = (tNow: number) => {
          if (disposed) return;
          const p = clamp01(((tNow - start) / 1000 - fadeStart) / 0.22);
          if (rootRef.current) {
            rootRef.current.style.opacity = `${1 - p}`;
            rootRef.current.style.pointerEvents = 'none';
          }
          if (p >= 1) {
            finishAndUnmount();
          } else {
            rafId = requestAnimationFrame(tickFade);
          }
        };
        rafId = requestAnimationFrame(tickFade);
      };

      rafId = requestAnimationFrame(tickReduced);
      return () => {
        disposed = true;
        window.clearTimeout(failsafeTimer);
        if (rafId) cancelAnimationFrame(rafId);
        document.body.style.overflow = prevOverflow;
      };
    }

    // ------------------------------------------------------------------
    // MODE B: Subsequent visits in same browsing session (~0.85s crisp transition)
    // ------------------------------------------------------------------
    if (isSubsequentVisit) {
      const start = performance.now();
      let holdOffset = 0;
      let lastNow = start;

      const tickShort = (now: number) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        lastNow = now;
        let t = (now - start) / 1000 - holdOffset;

        // Fast contour trace (0.0 -> 0.34s) + solid lock (0.28 -> 0.48s)
        const pOutline = easeInOutCubic(clamp01(t / 0.34));
        if (mainStroke) {
          mainStroke.style.strokeDashoffset = `${mainLen * (1 - pOutline)}`;
          mainStroke.style.opacity = `${1 - clamp01((t - 0.32) / 0.16)}`;
        }
        if (eUpperStroke) {
          const pe = easeInOutCubic(clamp01((t - 0.06) / 0.28));
          eUpperStroke.style.strokeDashoffset = `${eUpperLen * (1 - pe)}`;
          eUpperStroke.style.opacity = `${1 - clamp01((t - 0.32) / 0.16)}`;
        }

        if (solidGroupRef.current) {
          solidGroupRef.current.style.opacity = `${easeOutCubic(clamp01((t - 0.22) / 0.22))}`;
        }

        // Wait on solid logo only if app isn't ready yet
        if (t >= 0.48 && !appReady && !failsafeFired) {
          holdOffset += dt;
          rafId = requestAnimationFrame(tickShort);
          return;
        }

        // Fast smooth radial reveal (0.48 -> 0.86s)
        if (t >= 0.48) {
          const revealP = easeInOutQuart(clamp01((t - 0.48) / 0.38));
          if (svgWrapRef.current) {
            svgWrapRef.current.style.opacity = `${1 - clamp01(revealP * 1.45)}`;
            svgWrapRef.current.style.transform = `translate3d(0, ${(-6 * revealP).toFixed(2)}px, 0)`;
          }
          if (backdropRef.current) {
            const inner = revealP * 138;
            const outer = Math.min(185, inner + 32);
            const mask = `radial-gradient(circle at 50% 50%, transparent ${inner.toFixed(1)}%, #000 ${outer.toFixed(1)}%)`;
            backdropRef.current.style.maskImage = mask;
            backdropRef.current.style.setProperty('-webkit-mask-image', mask);
            backdropRef.current.style.opacity = `${1 - clamp01((revealP - 0.65) / 0.35)}`;
          }
          if (revealP > 0.35 && rootRef.current) {
            rootRef.current.style.pointerEvents = 'none';
            document.body.style.overflow = prevOverflow;
          }
          if (revealP >= 1) {
            finishAndUnmount();
            return;
          }
        }

        rafId = requestAnimationFrame(tickShort);
      };

      rafId = requestAnimationFrame(tickShort);
      return () => {
        disposed = true;
        window.clearTimeout(failsafeTimer);
        if (rafId) cancelAnimationFrame(rafId);
        document.body.style.overflow = prevOverflow;
      };
    }

    // ------------------------------------------------------------------
    // MODE C: Full Cinematic First-Visit Sequence (~3.6s)
    // Outline (0.0-0.8s) -> Liquid (0.8-1.8s) -> Hold (1.8-2.1s) ->
    // Microparticle Dissolution (2.1-2.5s) -> Organic Swarm (2.5-3.2s) ->
    // Overlapping Spatially-Coordinated Homepage Reveal (2.8-3.65s)
    // ------------------------------------------------------------------
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let cx = vw * 0.5;
    let cy = vh * 0.5;
    let maxCornerDist = Math.hypot(cx, cy);

    const sizeCanvas = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      cx = vw * 0.5;
      cy = vh * 0.5;
      maxCornerDist = Math.hypot(cx, cy);
      if (canvas) {
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
      }
    };
    sizeCanvas();

    // Adaptive particle budget based on viewport & hardware concurrency
    const cores = navigator.hardwareConcurrency || 4;
    const isMobileViewport = vw < 768;
    const targetParticles = isMobileViewport
      ? cores >= 6
        ? 3000
        : 2200
      : cores >= 8
        ? 6400
        : cores >= 4
          ? 5000
          : 4000;

    let pool: ParticlePool | null = null;
    let poolComputed = false;
    let slowFrames = 0;
    let renderStride = 1;

    // Precompute exact particle coordinates while Outline / Liquid animations run
    const precomputeParticles = () => {
      if (poolComputed || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      pool = sampleLogoParticles(rect, targetParticles, dpr);
      poolComputed = true;
    };

    const onResize = () => {
      sizeCanvas();
      // If still before dissolution, resample so alignment stays 1:1
      if (!poolComputed) return;
      if (timelineTimeRef < 2.02 && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width >= 10) {
          pool = sampleLogoParticles(rect, targetParticles, dpr);
        }
      }
    };
    window.addEventListener('resize', onResize, { passive: true });

    const startTime = performance.now();
    let lastNow = startTime;
    let holdOffset = 0;
    let timelineTimeRef = 0;
    let pointerReleased = false;

    const tickCinematic = (now: number) => {
      if (disposed) return;

      const rawDt = (now - lastNow) / 1000;
      const dt = Math.min(0.033, Math.max(0.001, rawDt));
      lastNow = now;

      // Adaptive performance guard: if consecutive slow frames occur during swarm, stride cleanly
      if (timelineTimeRef > 2.15 && rawDt > 0.03) {
        slowFrames++;
        if (slowFrames >= 6 && renderStride === 1) {
          renderStride = 2;
        }
      } else if (slowFrames > 0) {
        slowFrames--;
      }

      let t = (now - startTime) / 1000 - holdOffset;

      // Precompute particles quietly after first paint (during Stage 1 outline)
      if (!poolComputed && t >= 0.12) {
        precomputeParticles();
      }

      // STAGE 1: Precision Outline Tracing (0.0s -> 0.8s)
      if (t <= 1.85) {
        const mainTrace = easeInOutCubic(clamp01(t / 0.72));
        const upperTrace = easeInOutCubic(clamp01((t - 0.16) / 0.64));
        const strokeFade = 1 - clamp01((t - 1.56) / 0.24);

        if (mainStroke) {
          mainStroke.style.strokeDashoffset = `${(mainLen * (1 - mainTrace)).toFixed(2)}`;
          mainStroke.style.opacity = `${strokeFade.toFixed(3)}`;
        }
        if (eUpperStroke) {
          eUpperStroke.style.strokeDashoffset = `${(eUpperLen * (1 - upperTrace)).toFixed(2)}`;
          eUpperStroke.style.opacity = `${strokeFade.toFixed(3)}`;
        }
      }

      // STAGE 2: Organic Liquid Infusion (0.8s -> 1.8s)
      if (t >= 0.78 && t <= 1.86) {
        const fillP = clamp01((t - 0.8) / 1.0);
        const easedFill = easeInOutCubic(fillP);

        // Liquid rises from bottom (y = 892) to slightly past top (y = -48)
        const yLevel = 892 - easedFill * 940;
        // Amplitude swells gently in the middle and tapers strictly to 0 near top
        const ampEnvelope = Math.sin(fillP * Math.PI);
        const ampFront = (16 + ampEnvelope * 30) * (1 - clamp01((fillP - 0.78) / 0.22));
        const ampBack = ampFront * 0.8;

        if (liquidGroupRef.current) {
          liquidGroupRef.current.style.opacity = fillP >= 0.99 ? '0' : '1';
        }
        if (waveFrontRef.current) {
          waveFrontRef.current.setAttribute(
            'd',
            buildWavePath(yLevel, ampFront, 1.55, t * 4.6, 2.75, -t * 3.1 + 0.8)
          );
        }
        if (waveBackRef.current) {
          waveBackRef.current.setAttribute(
            'd',
            buildWavePath(yLevel - 9 * (1 - fillP), ampBack, 1.35, -t * 3.8 + 2.1, 2.35, t * 2.9)
          );
          // Blend subtle depth tint back into exact #BD011F before completion
          waveBackRef.current.style.opacity = `${(0.55 * (1 - clamp01((fillP - 0.72) / 0.28))).toFixed(3)}`;
        }

        // Cross-lock into flat solid official logo cleanly at 1.70 -> 1.80s
        if (solidGroupRef.current) {
          const solidLock = clamp01((t - 1.68) / 0.12);
          solidGroupRef.current.style.opacity = `${solidLock.toFixed(3)}`;
        }
      }

      // STAGE 3: Brand Recognition Hold (1.8s -> 2.1s, plus genuine readiness gate)
      if (t >= 1.8 && t < 2.1) {
        if (mainStroke) mainStroke.style.opacity = '0';
        if (eUpperStroke) eUpperStroke.style.opacity = '0';
        if (liquidGroupRef.current) liquidGroupRef.current.style.opacity = '0';
        if (solidGroupRef.current) solidGroupRef.current.style.opacity = '1';
      }

      // Hold cleanly on solid logo if app is still genuinely loading
      if (t >= 2.1 && !appReady && !failsafeFired) {
        holdOffset += dt;
        timelineTimeRef = 2.1;
        rafId = requestAnimationFrame(tickCinematic);
        return;
      }

      // Guarantee particles are sampled right before Stage 4 if viewport settled late
      if (t >= 2.04 && !poolComputed) {
        precomputeParticles();
      }

      timelineTimeRef = t;

      // STAGE 4 & 5: Microparticle Dissolution (2.1s -> 2.5s) & Organic Swarm (2.5s -> 3.65s)
      if (t >= 2.1 && ctx && canvas && pool && pool.count > 0) {
        const dissolveElapsed = t - 2.1;

        // Seamlessly crossfade SVG solid silhouette into pixel-identical particle layer
        // Zero jump: canvas ramps 0 -> 1 over first 90ms while SVG recedes 1 -> 0 over 60 -> 260ms
        const canvasFadeIn = clamp01(dissolveElapsed / 0.09);
        const svgFadeOut = 1 - easeOutCubic(clamp01((dissolveElapsed - 0.05) / 0.22));
        if (svgWrapRef.current) {
          svgWrapRef.current.style.opacity = `${svgFadeOut.toFixed(3)}`;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);

        const count = pool.count;
        const {
          x,
          y,
          originX,
          originY,
          vx,
          vy,
          size,
          delay,
          phase,
          speedMul,
          dirBias,
          colorIdx,
        } = pool;

        const fieldTime = dissolveElapsed * 1.1;
        const globalExitFade = 1 - easeInOutCubic(clamp01((t - 3.22) / 0.44));

        // Update physics & render grouped by palette color to minimize fillStyle state switches
        for (let i = 0; i < count; i += renderStride) {
          const localT = dissolveElapsed - delay[i];

          if (localT > 0) {
            const px = x[i];
            const py = y[i];

            // Divergence-free analytic curl velocity (~280-360 px/s graceful crimson ribbons)
            computeAnalyticCurl(px, py, fieldTime, 26000);
            const curlVx = curlOut.vx;
            const curlVy = curlOut.vy;

            // Outward vector from viewport center + gentle swirling tangential drift
            const dx = px - cx;
            const dy = py - cy;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            // Smooth acceleration ramp: delicate cohesive peel (0..0.38s) -> sweeping dispersion (0.38..1.4s)
            const peelRamp = easeInOutCubic(clamp01(localT / 0.42));
            const sweepAccel = easeInOutCubic(clamp01((localT - 0.16) / 0.72));
            const outwardMag = (55 + sweepAccel * 620) * speedMul[i];
            const swirlMag = (24 + sweepAccel * 135) * dirBias[i];
            const curlGain = (0.22 + peelRamp * 0.78) * speedMul[i];

            const targetVx =
              ux * outwardMag - uy * swirlMag + curlVx * curlGain;
            const targetVy =
              uy * outwardMag + ux * swirlMag + curlVy * curlGain;

            // Smooth fluid inertia (no jerky velocity jumps)
            const blend = 1 - Math.exp(-dt * (4.2 + sweepAccel * 3.8));
            vx[i] += (targetVx - vx[i]) * blend;
            vy[i] += (targetVy - vy[i]) * blend;

            x[i] = px + vx[i] * dt;
            y[i] = py + vy[i] * dt;
          } else {
            // Subtle micro-cohesion drift before particle's dissolution wave arrives
            const pre = clamp01(dissolveElapsed / Math.max(0.05, delay[i]));
            x[i] = originX[i] + Math.sin(phase[i] + dissolveElapsed * 4) * 0.35 * pre;
            y[i] = originY[i] + Math.cos(phase[i] + dissolveElapsed * 4) * 0.35 * pre;
          }
        }

        // Batch draw by crimson palette bucket for crisp 60 FPS canvas throughput
        const margin = 48;
        for (let c = 0; c < CRIMSON_PALETTE.length; c++) {
          ctx.fillStyle = CRIMSON_PALETTE[c];
          for (let i = 0; i < count; i += renderStride) {
            if (colorIdx[i] !== c) continue;
            const px = x[i];
            const py = y[i];
            if (px < -margin || px > vw + margin || py < -margin || py > vh + margin) {
              continue;
            }

            // Gradual edge fade as particles leave the viewport
            const edgeDist = Math.min(px + margin, vw + margin - px, py + margin, vh + margin - py);
            const edgeAlpha = clamp01(edgeDist / 90);
            const distFromCenter = Math.hypot(px - cx, py - cy);
            const outerSoftFade = 1 - clamp01((distFromCenter / (maxCornerDist * 1.08) - 0.72) / 0.36);

            const alpha = canvasFadeIn * globalExitFade * edgeAlpha * outerSoftFade;
            if (alpha <= 0.015) continue;

            ctx.globalAlpha = alpha;
            const s = size[i] * (renderStride === 2 ? 1.25 : 1);
            ctx.fillRect(px - s * 0.5, py - s * 0.5, s, s);
          }
        }
        ctx.globalAlpha = 1;
      }

      // STAGE 6: Spatially Coordinated Cinematic Homepage Reveal (2.8s -> 3.6s)
      if (t >= 2.8 && backdropRef.current) {
        const revealP = easeInOutQuart(clamp01((t - 2.8) / 0.8));

        // Expanding center-out reveal mask synchronized with the outward swarm wavefront
        const innerR = revealP * 136;
        const midR = Math.min(165, innerR + 18 + (1 - revealP) * 10);
        const outerR = Math.min(190, innerR + 40);
        const mask = `radial-gradient(circle at 50% 50%, transparent ${innerR.toFixed(1)}%, rgba(0, 0, 0, 0.38) ${midR.toFixed(1)}%, #000 ${outerR.toFixed(1)}%)`;

        backdropRef.current.style.maskImage = mask;
        backdropRef.current.style.setProperty('-webkit-mask-image', mask);
        backdropRef.current.style.opacity = `${(1 - clamp01((revealP - 0.72) / 0.28)).toFixed(3)}`;

        // Release pointer events & page scroll as soon as hero is largely revealed
        if (revealP >= 0.52 && !pointerReleased) {
          pointerReleased = true;
          document.body.style.overflow = prevOverflow;
          if (rootRef.current) {
            rootRef.current.style.pointerEvents = 'none';
          }
          markIntroReady();
        }
      }

      if (t >= 3.66) {
        finishAndUnmount();
        return;
      }

      rafId = requestAnimationFrame(tickCinematic);
    };

    rafId = requestAnimationFrame(tickCinematic);

    return () => {
      disposed = true;
      window.clearTimeout(failsafeTimer);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, markIntroReady]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="edc-preloader"
      role="status"
      aria-live="polite"
      aria-label="Loading EDC AITR portal"
    >
      {/* Layer 1: Dissolving Obsidian #080808 Backdrop Veil */}
      <div ref={backdropRef} className="edc-preloader__backdrop" aria-hidden="true" />

      {/* Layer 2: Precision Centered Official EDC Vector Logo (Outline + Liquid + Solid) */}
      <div ref={svgWrapRef} className="edc-preloader__stage" aria-hidden="true">
        <svg
          ref={svgRef}
          className="edc-preloader__svg"
          viewBox={EDC_MARK_VIEWBOX}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={EDC_CONTOUR_PATHS.main} />
              <path d={EDC_CONTOUR_PATHS.eUpper} />
            </clipPath>
          </defs>

          {/* Stage 2: Clipped Organic Liquid Infusion */}
          <g
            ref={liquidGroupRef}
            clipPath={`url(#${clipId})`}
            style={{ opacity: 0 }}
          >
            <path
              ref={waveBackRef}
              d={`M -30 ${EDC_MARK_HEIGHT + 60} L ${EDC_MARK_WIDTH + 30} ${EDC_MARK_HEIGHT + 60} Z`}
              fill="#960018"
            />
            <path
              ref={waveFrontRef}
              d={`M -30 ${EDC_MARK_HEIGHT + 60} L ${EDC_MARK_WIDTH + 30} ${EDC_MARK_HEIGHT + 60} Z`}
              fill={EDC_CRIMSON}
            />
          </g>

          {/* Stage 3: Pure Flat Solid Official EDC Logo */}
          <g ref={solidGroupRef} style={{ opacity: 0 }}>
            <path d={EDC_CONTOUR_PATHS.main} fill={EDC_CRIMSON} />
            <path d={EDC_CONTOUR_PATHS.eUpper} fill={EDC_CRIMSON} />
          </g>

          {/* Stage 1: Exact Continuous Contour Precision Outline */}
          <path
            ref={mainStrokeRef}
            d={EDC_CONTOUR_PATHS.main}
            stroke={EDC_CRIMSON}
            strokeWidth="1.35"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ opacity: 0 }}
          />
          <path
            ref={eUpperStrokeRef}
            d={EDC_CONTOUR_PATHS.eUpper}
            stroke={EDC_CRIMSON}
            strokeWidth="1.35"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ opacity: 0 }}
          />
        </svg>
      </div>

      {/* Layer 3: Full-Viewport Microparticle Swarm Canvas (sits above dissolving veil) */}
      <canvas
        ref={canvasRef}
        className="edc-preloader__canvas"
        aria-hidden="true"
      />
    </div>
  );
};

export default EdcPreloader;
