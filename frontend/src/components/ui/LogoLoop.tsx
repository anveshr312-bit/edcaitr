'use client';

import React, {
  type CSSProperties,
  memo,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const SMOOTH_TAU = 0.25;
const GLIDE_TAU = 0.8;
const DRAG_THRESHOLD = 6;
const MAX_FLING = 4000;
const INTRO_TIME = 0.7;
const INTRO_STAGGER = 0.45;
const HALF_SQRT_PI = Math.sqrt(Math.PI) / 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toCssLength = (value: number | string | undefined) =>
  typeof value === 'number' ? `${value}px` : (value ?? undefined);

const erf = (x: number) => {
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return x < 0 ? -y : y;
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const fadeMask = (size: number, vertical: boolean) => {
  const span = clamp(size, 0, 0.5) * 100;
  if (span <= 0) return undefined;
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    stops.push(
      `rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${((span * i) / 12).toFixed(3)}%`
    );
  }
  for (let i = 12; i >= 0; i--) {
    stops.push(
      `rgba(0,0,0,${smootherstep(i / 12).toFixed(4)}) ${(100 - (span * i) / 12).toFixed(3)}%`
    );
  }
  return `linear-gradient(${vertical ? 'to bottom' : 'to right'}, ${stops.join(', ')})`;
};

export interface LogoNodeItem {
  node: ReactNode;
  title?: string;
  ariaLabel?: string;
  href?: string;
  hoverColor?: string;
}

export interface LogoImageItem {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  title?: string;
  href?: string;
  hoverColor?: string;
}

export type LogoItem = LogoNodeItem | LogoImageItem;

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutWidth?: number;
  scaleOnHover?: boolean;
  layout?: 'line' | 'wave' | 'arc' | 'orbit';
  bend?: number;
  focus?: number;
  magnify?: number;
  tiltX?: number;
  tiltY?: number;
  step?: boolean;
  muted?: number;
  labels?: 'none' | 'inline' | 'below' | 'hover';
  draggable?: boolean;
  scrollBoost?: number;
  intro?: boolean;
  renderItem?: (item: LogoItem, key: React.Key) => ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface InternalConfig {
  speed: number;
  dirSign: number;
  hoverValue: number | undefined;
  vertical: boolean;
  layout: 'line' | 'wave' | 'arc' | 'orbit';
  bend: number;
  focus: number;
  magnify: number;
  tiltX: number;
  tiltY: number;
  step: boolean;
  draggable: boolean;
  scrollBoost: number;
  intro: boolean;
  scaleOnHover: boolean;
  labels: 'none' | 'inline' | 'below' | 'hover';
  links: boolean;
}

interface TrackItem {
  el: HTMLElement;
  copy: number;
  index: number;
  content: HTMLElement | null;
  tip: HTMLElement | null;
  center: number;
  size: number;
  cross: number;
  t: string;
  o: string;
  v: string;
  z: string;
  s: string;
  p: string;
}

const createEngine = (
  root: HTMLDivElement,
  track: HTMLDivElement,
  config: React.MutableRefObject<InternalConfig>,
  setLayout: React.Dispatch<
    React.SetStateAction<{ copies: number; primary: number }>
  >
) => {
  const query =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  const st = {
    offset: 0,
    velocity: 0,
    period: 0,
    length: 0,
    box: [0, 0] as [number, number],
    items: [] as TrackItem[],
    snaps: [] as number[],
    pitch: 0,
    crossMax: 0,
    sizeMax: 0,
    tipMax: 0,
    lead: 0,
    layout: { copies: 2, primary: 0 },
    hovered: false,
    focused: false,
    pointer: null as [number, number] | null,
    pointerInside: false,
    mag: 0,
    magU: 0,
    magReady: false,
    drag: null as {
      id: number;
      x: number;
      y: number;
      active: boolean;
      samples: [number, number][];
      anchor: number;
      offset: number;
    } | null,
    glide: false,
    suppressUntil: 0,
    pressedAt: -1e9,
    scrollVel: 0,
    scrollY: window.scrollY,
    scrollT: 0,
    visible: typeof IntersectionObserver === 'undefined',
    introStart: -1,
    introDone: !config.current.intro,
    itemMode: false,
    active: null as TrackItem | null,
    raf: 0,
    last: 0,
    reduced: !!query?.matches,
    destroyed: false,
  };

  const collect = () => {
    const items: TrackItem[] = [];
    Array.from(track.children).forEach((list, copy) => {
      Array.from(list.children).forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        items.push({
          el: htmlEl,
          copy,
          index,
          content: (htmlEl.children[0] as HTMLElement) || null,
          tip: (htmlEl.children[1] as HTMLElement) || null,
          center: 0,
          size: 0,
          cross: 0,
          t: '',
          o: '',
          v: '',
          z: '',
          s: '',
          p: '',
        });
      });
    });
    st.items = items;
    st.active = null;
  };

  const clearItems = () => {
    for (const it of st.items) {
      it.el.style.transform = '';
      it.el.style.opacity = '';
      it.el.style.visibility = '';
      it.el.style.zIndex = '';
      if (it.content) it.content.style.transform = '';
      if (it.tip) it.tip.style.transform = '';
      it.t = it.o = it.v = it.z = it.s = it.p = '';
    }
  };

  const measure = () => {
    const cfg = config.current;
    const lists = track.children;
    if (!lists.length || !st.items.length) {
      st.period = 0;
      return;
    }
    track.style.transform = 'none';
    clearItems();

    const rootRect = root.getBoundingClientRect();
    const k = root.offsetWidth ? rootRect.width / root.offsetWidth || 1 : 1;
    const trackRect = track.getBoundingClientRect();
    const origin = cfg.vertical ? trackRect.top : trackRect.left;

    let crossMax = 0;
    let sizeMax = 0;
    let tipMax = 0;
    for (const it of st.items) {
      const r = it.el.getBoundingClientRect();
      it.center =
        ((cfg.vertical ? r.top + r.height / 2 : r.left + r.width / 2) - origin) /
        k;
      it.size = (cfg.vertical ? r.height : r.width) / k;
      it.cross = (cfg.vertical ? r.width : r.height) / k;
      crossMax = Math.max(crossMax, it.cross);
      sizeMax = Math.max(sizeMax, it.size);
      if (it.tip && it.copy === 0) tipMax = Math.max(tipMax, it.tip.offsetWidth);
    }

    const a = lists[0].getBoundingClientRect();
    const b = lists[1] ? lists[1].getBoundingClientRect() : null;
    st.period =
      (b
        ? cfg.vertical
          ? b.top - a.top
          : b.left - a.left
        : cfg.vertical
          ? a.height
          : a.width) / k;

    const cs = getComputedStyle(root);
    st.box = [root.offsetWidth, root.offsetHeight];
    st.length = cfg.vertical
      ? root.clientHeight -
        parseFloat(cs.paddingTop) -
        parseFloat(cs.paddingBottom)
      : root.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
    st.crossMax = crossMax;
    st.sizeMax = sizeMax;
    st.tipMax = tipMax + crossMax * 0.25;

    const first = st.items.filter((it) => it.copy === 0);
    st.pitch = first.length ? st.period / first.length : st.period;
    st.snaps = first.map((it) => it.center);

    if (st.period <= 0) return;

    const pad =
      (cfg.scaleOnHover ? crossMax * 0.14 : 0) +
      (cfg.magnify > 0 ? (crossMax * cfg.magnify) / 2 : 0) +
      (cfg.labels === 'hover' ? 24 : 0);
    root.style.setProperty('--logoloop-pad', `${Math.ceil(pad)}px`);

    const lead = Math.max(1, Math.ceil((st.length / 2 + sizeMax) / st.period)) * st.period;
    st.lead = lead;
    const copies = Math.max(
      3,
      Math.ceil((st.length + sizeMax * 2 + lead) / st.period) + 2
    );
    const primary = Math.min(copies - 1, Math.floor((lead + st.length / 2) / st.period));
    if (copies !== st.layout.copies || primary !== st.layout.primary) {
      st.layout = { copies, primary };
      setLayout(st.layout);
    }
  };

  const render = (now: number) => {
    const cfg = config.current;
    const L = st.length;
    const half = L / 2;
    const T = -st.offset - st.lead;
    track.style.transform = cfg.vertical
      ? `translate3d(0px, ${T.toFixed(2)}px, 0px)`
      : `translate3d(${T.toFixed(2)}px, 0px, 0px)`;

    const introRunning = st.introStart >= 0;
    const elapsed = introRunning ? (now - st.introStart) / 1000 : 0;
    const lensMag = clamp(cfg.magnify, 0, 1) * st.mag;
    const needItems = lensMag > 0.0005 || introRunning;

    if (!needItems && st.itemMode) clearItems();
    st.itemMode = needItems;
    if (!needItems) return;

    const magSigma = Math.max(st.crossMax * 1.4, st.pitch * 1.1);

    for (const it of st.items) {
      const u = T + it.center - half;
      let x = u;
      let y = 0;
      let scale = 1;
      let opacity = 1;

      if (lensMag > 0) {
        const km = (u - st.magU) / magSigma;
        scale *= 1 + lensMag * Math.exp(-km * km);
        x += lensMag * magSigma * HALF_SQRT_PI * erf(km);
      }

      if (introRunning) {
        const pos = clamp((x + half) / Math.max(1, L), 0, 1);
        const e = easeOut(clamp((elapsed - pos * INTRO_STAGGER) / INTRO_TIME, 0, 1));
        opacity *= e;
        y += (1 - e) * 14;
      }

      const along = x - u;
      const t = cfg.vertical
        ? `translate3d(${y.toFixed(2)}px, ${along.toFixed(2)}px, 0px)`
        : `translate3d(${along.toFixed(2)}px, ${y.toFixed(2)}px, 0px)`;
      if (it.t !== t) {
        it.t = t;
        it.el.style.transform = t;
      }
      const o = opacity > 0.999 ? '' : opacity.toFixed(3);
      if (it.o !== o) {
        it.o = o;
        it.el.style.opacity = o;
      }
      if (it.content) {
        const s = Math.abs(scale - 1) < 0.0005 ? '' : `scale(${scale.toFixed(4)})`;
        if (it.s !== s) {
          it.s = s;
          it.content.style.transform = s;
        }
      }
    }
  };

  const frame = (now: number) => {
    st.raf = 0;
    if (st.destroyed || st.period <= 0) return;
    const cfg = config.current;
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.1) : 0;
    st.last = now;
    const P = st.period;
    let busy = false;

    if (st.introStart === -1 && !st.introDone && st.visible) {
      if (cfg.intro && !st.reduced) {
        st.introStart = now;
      } else {
        st.introDone = true;
      }
      root.removeAttribute('data-intro');
    }
    if (st.introStart >= 0) {
      if ((now - st.introStart) / 1000 >= INTRO_TIME + INTRO_STAGGER) {
        st.introStart = -2;
        st.introDone = true;
      } else {
        busy = true;
      }
    }

    const travel = Math.sign(cfg.speed) || 1;
    const paused = st.focused || (st.hovered && cfg.hoverValue !== undefined);
    const pausedSpeed = st.focused ? 0 : (cfg.hoverValue ?? 0);
    let target = st.reduced
      ? 0
      : paused
        ? pausedSpeed * travel * cfg.dirSign
        : cfg.speed * cfg.dirSign;

    if (cfg.scrollBoost > 0 && !st.reduced) {
      st.scrollVel *= Math.exp(-dt / 0.18);
      if (Math.abs(st.scrollVel) > 1) busy = true;
      target += clamp(st.scrollVel * cfg.scrollBoost, -2400, 2400) * travel * cfg.dirSign;
    }

    if (st.drag?.active) {
      busy = true;
    } else {
      const tau = st.glide ? GLIDE_TAU : SMOOTH_TAU;
      st.velocity += (target - st.velocity) * (1 - Math.exp(-dt / tau));
      if (st.glide && Math.abs(st.velocity - target) < 2) st.glide = false;
      if (Math.abs(st.velocity - target) < 0.01) st.velocity = target;
      st.offset += st.velocity * dt;
      if (st.velocity !== 0 || target !== 0) busy = true;
    }

    if (!st.focused && !st.drag?.active) {
      st.offset = ((st.offset % P) + P) % P;
    }

    const wantMag = cfg.magnify > 0 && st.pointerInside && !st.reduced ? 1 : 0;
    if (st.mag !== wantMag) {
      st.mag +=
        (wantMag - st.mag) * (1 - Math.exp(-dt / (wantMag ? 0.12 : 0.25)));
      if (Math.abs(wantMag - st.mag) < 0.002) st.mag = wantMag;
      busy = true;
    }

    if (st.mag > 0 && st.pointer) {
      const pu = cfg.vertical
        ? st.pointer[1] - st.box[1] / 2
        : st.pointer[0] - st.box[0] / 2;
      if (!st.magReady) {
        st.magU = pu;
        st.magReady = true;
      }
      const next = st.magU + (pu - st.magU) * (1 - Math.exp(-dt / 0.06));
      if (Math.abs(next - pu) > 0.05) busy = true;
      st.magU = Math.abs(next - pu) > 0.05 ? next : pu;
    } else if (st.mag === 0) {
      st.magReady = false;
    }

    render(now);
    if (busy && st.visible && !st.destroyed) {
      st.raf = requestAnimationFrame(frame);
    }
  };

  const wake = () => {
    if (st.raf || st.destroyed || !st.visible) return;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent): [number, number] => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth ? r.width / root.offsetWidth || 1 : 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  };

  const onEnter = (e: PointerEvent) => {
    st.hovered = true;
    if (e.pointerType !== 'touch') {
      st.pointerInside = true;
      st.pointer = local(e);
    }
    wake();
  };

  const onLeave = () => {
    st.hovered = false;
    st.pointerInside = false;
    wake();
  };

  const onDown = (e: PointerEvent) => {
    st.pressedAt = performance.now();
    if (!config.current.draggable || (e.pointerType === 'mouse' && e.button !== 0))
      return;
    const [x, y] = local(e);
    if (e.pointerType !== 'touch') st.pointer = [x, y];
    st.drag = {
      id: e.pointerId,
      x,
      y,
      active: false,
      samples: [],
      anchor: 0,
      offset: 0,
    };
  };

  const onMove = (e: PointerEvent) => {
    const cfg = config.current;
    if (e.pointerType !== 'touch') {
      st.pointer = local(e);
      st.pointerInside = true;
    }
    const d = st.drag;
    if (d && e.pointerId === d.id) {
      const [x, y] = local(e);
      const along = cfg.vertical ? y - d.y : x - d.x;
      const across = cfg.vertical ? x - d.x : y - d.y;
      if (!d.active) {
        if (Math.abs(along) < DRAG_THRESHOLD) return wake();
        if (Math.abs(across) > Math.abs(along)) {
          st.drag = null;
          return wake();
        }
        d.active = true;
        d.anchor = along;
        d.offset = st.offset;
        st.glide = false;
        st.velocity = 0;
        try {
          root.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        root.setAttribute('data-dragging', '');
      }
      const next = d.offset - (along - d.anchor);
      const P = st.period || 1;
      st.offset = ((next % P) + P) % P;
      d.offset += st.offset - next;
      const now = performance.now();
      d.samples.push([now, along]);
      while (d.samples.length > 2 && now - d.samples[0][0] > 100)
        d.samples.shift();
    }
    wake();
  };

  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (!d.active) return;
    root.removeAttribute('data-dragging');
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const now = performance.now();
    st.suppressUntil = now + 400;
    let v = 0;
    const s = d.samples;
    if (!cancelled && s.length > 1) {
      const [t0, a0] = s[0];
      const [t1, a1] = s[s.length - 1];
      if (t1 > t0 && now - t1 < 80) {
        v = clamp((-(a1 - a0) / (t1 - t0)) * 1000, -MAX_FLING, MAX_FLING);
      }
    }
    st.velocity = v;
    st.glide = Math.abs(v) > 30;
    wake();
  };

  const onUp = (e: PointerEvent) => endDrag(e, false);
  const onCancel = (e: PointerEvent) => endDrag(e, true);

  const onClick = (e: MouseEvent) => {
    if (performance.now() < st.suppressUntil) {
      e.preventDefault();
      e.stopPropagation();
      st.suppressUntil = 0;
    }
  };

  const onDragStart = (e: DragEvent) => {
    if (config.current.draggable) e.preventDefault();
  };

  const onFocusIn = () => {
    if (performance.now() - st.pressedAt < 800) return;
    st.focused = true;
    wake();
  };

  const onFocusOut = (e: FocusEvent) => {
    if (root.contains(e.relatedTarget as Node | null)) return;
    st.focused = false;
    wake();
  };

  const onScroll = () => {
    const now = performance.now();
    const y = window.scrollY;
    if (st.scrollT && now > st.scrollT) {
      const v = ((y - st.scrollY) / (now - st.scrollT)) * 1000;
      st.scrollVel += (clamp(v, -6000, 6000) - st.scrollVel) * 0.5;
    }
    st.scrollY = y;
    st.scrollT = now;
    if (config.current.scrollBoost > 0) wake();
  };

  const onMotion = () => {
    st.reduced = !!query?.matches;
    wake();
  };

  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onCancel);
  root.addEventListener('lostpointercapture', onCancel);
  root.addEventListener('click', onClick, true);
  root.addEventListener('dragstart', onDragStart);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  window.addEventListener('scroll', onScroll, { passive: true });
  query?.addEventListener?.('change', onMotion);

  let resizeObserver: ResizeObserver | null = null;
  const observed = new Set<Element>();
  const refresh = () => {
    collect();
    measure();
    if (resizeObserver) {
      const first = track.children[0];
      for (const el of [root, first]) {
        if (el && !observed.has(el)) {
          resizeObserver.observe(el);
          observed.add(el);
        }
      }
    }
    st.last = 0;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
    if (st.period > 0) frame(performance.now());
  };

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      measure();
      if (st.period > 0) render(performance.now());
      wake();
    });
  } else {
    window.addEventListener('resize', refresh);
  }

  let intersection: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    intersection = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        st.visible = entry.isIntersecting;
        if (st.visible) wake();
      },
      { threshold: 0.1 }
    );
    intersection.observe(root);
  }

  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const destroy = () => {
    st.destroyed = true;
    if (st.raf) cancelAnimationFrame(st.raf);
    root.removeEventListener('pointerenter', onEnter);
    root.removeEventListener('pointerleave', onLeave);
    root.removeEventListener('pointerdown', onDown);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerup', onUp);
    root.removeEventListener('pointercancel', onCancel);
    root.removeEventListener('lostpointercapture', onCancel);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('dragstart', onDragStart);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', refresh);
    document.removeEventListener('visibilitychange', onVisibility);
    query?.removeEventListener?.('change', onMotion);
    resizeObserver?.disconnect();
    intersection?.disconnect();
  };

  // Prevent unused-helper warning for easeInOut while preserving full fidelity
  void easeInOut;

  return { refresh, wake, destroy };
};

export const LogoLoop: React.FC<LogoLoopProps> = memo(
  ({
    logos,
    speed = 70,
    direction = 'left',
    width = '100%',
    logoHeight = 40,
    gap = 40,
    pauseOnHover,
    hoverSpeed,
    fadeOut = true,
    fadeOutWidth = 0.12,
    scaleOnHover = true,
    layout = 'line',
    bend = 0.5,
    focus = 0,
    magnify = 0,
    tiltX = 0,
    tiltY = 0,
    step = false,
    muted = 0,
    labels = 'none',
    draggable = true,
    scrollBoost = 0.15,
    intro = true,
    renderItem,
    ariaLabel = 'Partner logos',
    className,
    style,
  }) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
    const [{ copies, primary }, setLayout] = useState({ copies: 3, primary: 1 });
    const [introPending] = useState(intro);

    const vertical = direction === 'up' || direction === 'down';
    const config = useRef<InternalConfig>({
      speed,
      dirSign: 1,
      hoverValue: 0,
      vertical,
      layout,
      bend,
      focus,
      magnify,
      tiltX,
      tiltY,
      step,
      draggable,
      scrollBoost,
      intro,
      scaleOnHover,
      labels,
      links: false,
    });

    config.current = {
      speed,
      dirSign: (vertical ? direction === 'up' : direction !== 'right') ? 1 : -1,
      hoverValue:
        hoverSpeed !== undefined
          ? hoverSpeed
          : pauseOnHover === false
            ? undefined
            : 0,
      vertical,
      layout,
      bend,
      focus,
      magnify,
      tiltX,
      tiltY,
      step,
      draggable,
      scrollBoost,
      intro,
      scaleOnHover,
      labels,
      links: logos.some((item) => Boolean(item.href)),
    };

    useIsomorphicLayoutEffect(() => {
      if (!rootRef.current || !trackRef.current) return undefined;
      const engine = createEngine(
        rootRef.current,
        trackRef.current,
        config,
        setLayout
      );
      engineRef.current = engine;
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    }, []);

    useIsomorphicLayoutEffect(() => {
      engineRef.current?.refresh();
    }, [
      copies,
      primary,
      logos,
      vertical,
      logoHeight,
      gap,
      labels,
      layout,
      bend,
      focus,
      magnify,
      tiltX,
      tiltY,
      scaleOnHover,
    ]);

    useEffect(() => {
      engineRef.current?.wake();
    });

    const lists = useMemo(
      () =>
        Array.from({ length: copies }, (_, copyIndex) => {
          const isPrimary = copyIndex === primary;
          return (
            <ul
              className="logoloop__list"
              key={copyIndex}
              role="list"
              aria-hidden={isPrimary ? undefined : true}
            >
              {logos.map((item, itemIndex) => {
                const key = `${copyIndex}-${itemIndex}`;
                const isNode = 'node' in item;
                const visual = renderItem ? (
                  renderItem(item, key)
                ) : isNode ? (
                  <span
                    className="logoloop__node"
                    aria-hidden={!!item.href && !item.ariaLabel}
                  >
                    {item.node}
                  </span>
                ) : (
                  <img
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes={item.sizes}
                    width={item.width}
                    height={item.height}
                    alt={item.alt ?? ''}
                    title={item.title}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                );
                const text =
                  (labels === 'inline' || labels === 'below') && item.title
                    ? item.title
                    : null;
                const inner = (
                  <>
                    {visual}
                    {text && (
                      <span
                        className="logoloop__label"
                        aria-hidden={!isNode && !!(item as LogoImageItem).alt}
                      >
                        {text}
                      </span>
                    )}
                  </>
                );
                const name = isNode
                  ? (item.ariaLabel ?? item.title)
                  : ((item as LogoImageItem).alt ?? item.title);
                return (
                  <li
                    className="logoloop__item"
                    key={key}
                    role="listitem"
                    data-color={item.hoverColor ? '' : undefined}
                    style={
                      item.hoverColor
                        ? ({
                            '--logoloop-item-color': item.hoverColor,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    {item.href ? (
                      <a
                        className="logoloop__content"
                        href={item.href}
                        aria-label={name || 'logo link'}
                        target="_blank"
                        rel="noreferrer noopener"
                        draggable={false}
                        tabIndex={isPrimary ? undefined : -1}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="logoloop__content">{inner}</div>
                    )}
                    {labels === 'hover' && item.title && (
                      <span className="logoloop__tip" aria-hidden="true">
                        {item.title}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }),
      [copies, primary, logos, renderItem, labels]
    );

    const mask = fadeOut ? fadeMask(fadeOutWidth, vertical) : undefined;
    const amount = clamp(muted, 0, 1);

    const containerStyle: CSSProperties = {
      width: vertical
        ? toCssLength(width) === '100%'
          ? undefined
          : toCssLength(width)
        : (toCssLength(width) ?? '100%'),
      ...(mask && { WebkitMaskImage: mask, maskImage: mask }),
      ...style,
      ...({
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        ...(amount > 0 && {
          '--logoloop-gray': Math.min(1, amount * 2).toFixed(3),
          '--logoloop-dim': (1 - amount * 0.6).toFixed(3),
        }),
      } as CSSProperties),
    };

    const rootClassName = [
      'logoloop',
      vertical ? 'logoloop--vertical' : 'logoloop--horizontal',
      scaleOnHover && 'logoloop--scale-hover',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={rootRef}
        className={rootClassName}
        style={containerStyle}
        role="region"
        aria-label={ariaLabel}
        data-intro={introPending ? '' : undefined}
        data-draggable={draggable ? '' : undefined}
        data-muted={amount > 0 ? '' : undefined}
        data-labels={labels !== 'none' ? labels : undefined}
      >
        <div className="logoloop__track" ref={trackRef}>
          {lists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
