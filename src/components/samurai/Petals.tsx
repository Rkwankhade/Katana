'use client';
import { useEffect, useRef } from 'react';
import { director } from '@/lib/director';
import { useMotionOK, useSeason, useTier } from '@/lib/preferences';
import {
  PARTICLE_COLORS, POINTER_MAX_PUSH_SPEED, clampMag, damp, kindForSeason, particleCount, pointerPush, scrollWind, smoothVelocity, stepFade, windY,
  type ParticleKind,
} from '@/lib/particles';

interface Particle {
  kind: ParticleKind; x: number; y: number; s: number; vy: number; vx: number; rot: number; vr: number; ph: number; sw: number; a: number; tint: number;
  ex: number; ey: number; // extra velocity from the pointer, damped back to zero
  fade: number; dying: boolean; // season crossfade
}
const mulberry = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// Unit-size maple outline (5 lobes), points as [x, y].
const MAPLE: [number, number][] = [[0, -1], [.22, -.5], [.62, -.62], [.5, -.18], [.98, -.1], [.52, .2], [.62, .58], [.2, .42], [0, .95], [-.2, .42], [-.62, .58], [-.52, .2], [-.98, -.1], [-.5, -.18], [-.62, -.62], [-.22, -.5]];

/**
 * One fixed canvas for every ambient particle. Spring petals (the original look), summer fireflies, autumn leaves and winter snow share
 * the same loop, budgets and cleanup. Pointer and scroll only nudge particles; the canvas never receives pointer events.
 * Off for reduced motion, Calm and tier 0; half the particles on tier 1. Pauses when the tab is hidden or the cinematic intro is on screen.
 */
export default function Petals() {
  const ref = useRef<HTMLCanvasElement>(null);
  const motionOK = useMotionOK(); const tier = useTier(); const season = useSeason();
  const enabled = motionOK && tier > 0;
  const seasonRef = useRef(season);
  const changeKind = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cv = ref.current; if (!cv || !enabled) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const rnd = mulberry(20260);
    let w = 0; let h = 0; let parts: Particle[] = []; let stopFrame: (() => void) | null = null; let clock = 0; let active = false;
    let kind: ParticleKind = kindForSeason(seasonRef.current);
    // pointer (mouse and pen only; touch is never tracked so native scrolling is untouched)
    let px = 0; let py = 0; let hasPointer = false; let lpx = 0; let lpy = 0; let pointerSpeed = 0;
    // scroll wind
    let lastY = window.scrollY; let lastT = performance.now(); let scrollV = 0;

    const spawn = (k: ParticleKind, initial: boolean): Particle => {
      const base = { kind: k, ex: 0, ey: 0, fade: 1, dying: false };
      if (k === 'leaf') return { ...base, x: rnd() * w, y: initial ? rnd() * h : -20 - rnd() * 80, s: 6 + rnd() * 5, vy: 22 + rnd() * 30, vx: 10 + rnd() * 18, rot: rnd() * 6.28, vr: (rnd() - 0.5) * 2.4, ph: rnd() * 6.28, sw: 0.5 + rnd() * 0.8, a: 0.55 + rnd() * 0.3, tint: rnd() };
      if (k === 'snow') return { ...base, x: rnd() * w, y: initial ? rnd() * h : -10 - rnd() * 60, s: 1.3 + rnd() * 2.1, vy: 14 + rnd() * 22, vx: 2 + rnd() * 8, rot: 0, vr: 0, ph: rnd() * 6.28, sw: 0.4 + rnd() * 0.7, a: 0.45 + rnd() * 0.4, tint: rnd() };
      if (k === 'firefly') return { ...base, x: rnd() * w, y: h * (0.25 + rnd() * 0.75), s: 1.5 + rnd() * 1.3, vy: 0, vx: 0, rot: 0, vr: 0, ph: rnd() * 6.28, sw: 0.5 + rnd() * 1.1, a: 0.5 + rnd() * 0.4, tint: rnd() };
      return { ...base, x: rnd() * w, y: initial ? rnd() * h : -20 - rnd() * 80, s: 5 + rnd() * 6, vy: 18 + rnd() * 26, vx: 6 + rnd() * 14, rot: rnd() * 6.28, vr: (rnd() - 0.5) * 1.6, ph: rnd() * 6.28, sw: 0.6 + rnd() * 0.9, a: 0.35 + rnd() * 0.4, tint: rnd() };
    };
    const seed = (k: ParticleKind) => Array.from({ length: particleCount(k, w, tier) }, () => spawn(k, true));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); const nw = window.innerWidth; const nh = window.innerHeight;
      const widthChanged = nw !== w; w = nw; h = nh;
      cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || parts.length === 0) parts = seed(kind); // height-only changes (mobile toolbars) keep the current particles
    };

    // Season changed: current particles fade out and are not replaced; a fresh set fades in. No reseed, no pop.
    const applyKind = () => {
      const next = kindForSeason(seasonRef.current); if (next === kind) return;
      kind = next; parts.forEach((p) => { p.dying = true; });
      const fresh = seed(kind); fresh.forEach((p) => { p.fade = 0; }); parts.push(...fresh);
    };
    changeKind.current = applyKind;

    const colorOf = (p: Particle) => { const c = PARTICLE_COLORS[p.kind]; return p.kind === 'petal' ? (p.tint > 0.5 ? c[0] : c[1]) : c[Math.min(c.length - 1, Math.floor(p.tint * c.length))]; };

    const draw = (deltaMs: number) => {
      if (!active) return;
      const dt = Math.min(0.05, deltaMs / 1000 || 0.016); clock += dt * 1000; const t = clock;
      // pointer speed, smoothed
      if (hasPointer) { pointerSpeed += (Math.hypot(px - lpx, py - lpy) / dt - pointerSpeed) * 0.25; lpx = px; lpy = py; } else pointerSpeed = 0;
      scrollV = damp(scrollV, dt, 3.2); const wind = scrollWind(scrollV);
      ctx.clearRect(0, 0, w, h);
      let write = 0;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.fade = stepFade(p.fade, dt, p.dying ? -1 : 1);
        if (p.dying && p.fade <= 0) continue; // faded out: drop it
        parts[write++] = p;
        // pointer displacement: smooth push, then damped return
        if (hasPointer) { const f = pointerPush(p.x - px, p.y - py, pointerSpeed); p.ex += f.ax * dt; p.ey += f.ay * dt; }
        p.ex = damp(p.ex, dt); p.ey = damp(p.ey, dt);
        const c = clampMag(p.ex, p.ey, POINTER_MAX_PUSH_SPEED); p.ex = c.x; p.ey = c.y;
        const depth = Math.min(1, p.s / 11);
        const wy = windY(wind, depth);
        if (p.kind === 'firefly') {
          p.x += (Math.cos(t / 1000 * 0.4 * p.sw + p.ph) * 12 + p.ex) * dt; p.y += (Math.sin(t / 1000 * 0.3 * p.sw + p.ph * 1.3) * 9 + wy * 0.3 + p.ey) * dt;
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20; if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
        } else {
          const sway = p.kind === 'snow' ? 9 : p.kind === 'leaf' ? 22 : 14;
          p.y += (p.vy + wy + p.ey) * dt; p.x += (p.vx + Math.sin(t / 1000 * p.sw + p.ph) * sway + p.ex) * dt; p.rot += p.vr * dt;
          if (!p.dying && (p.y > h + 20 || p.x > w + 30 || p.y < -140)) Object.assign(p, spawn(p.kind, false), { x: rnd() * w * 0.9 - 40, fade: 1 });
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = colorOf(p);
        if (p.kind === 'petal') {
          const flip = 0.55 + 0.45 * Math.cos(t / 700 + p.ph);
          ctx.rotate(p.rot); ctx.scale(1, flip); ctx.globalAlpha = p.a * p.fade;
          ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.7, p.s * 0.8, p.s * 0.6, 0, p.s); ctx.bezierCurveTo(-p.s * 0.8, p.s * 0.6, -p.s * 0.9, -p.s * 0.7, 0, -p.s); ctx.fill();
        } else if (p.kind === 'leaf') {
          const flip = 0.45 + 0.55 * Math.cos(t / 620 + p.ph); const s = p.s;
          ctx.rotate(p.rot); ctx.scale(1, flip); ctx.globalAlpha = p.a * p.fade; ctx.beginPath();
          if (p.tint < 0.5) { // ginkgo fan
            ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.1, s * 0.1, -s * 1.0, -s * 0.7, -s * 0.15, -s * 0.8); ctx.quadraticCurveTo(0, -s * 0.55, s * 0.15, -s * 0.8); ctx.bezierCurveTo(s * 1.0, -s * 0.7, s * 1.1, s * 0.1, 0, s * 0.9);
          } else { // maple
            ctx.moveTo(MAPLE[0][0] * s, MAPLE[0][1] * s); for (let k = 1; k < MAPLE.length; k++) ctx.lineTo(MAPLE[k][0] * s, MAPLE[k][1] * s); ctx.closePath();
          }
          ctx.fill();
        } else if (p.kind === 'snow') {
          ctx.globalAlpha = p.a * p.fade; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.2832); ctx.fill();
        } else { // firefly: a soft halo and a bright core, pulsing slowly
          const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * 1.1 * p.sw + p.ph));
          ctx.globalAlpha = 0.16 * pulse * p.fade; ctx.beginPath(); ctx.arc(0, 0, p.s * 4, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = p.a * pulse * p.fade; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }
      parts.length = write;
    };

    // Shared scroll hub: visibility of the layer and scroll velocity come from the same callback (no extra scroll listener).
    const sync = () => {
      const now = performance.now(); const y = window.scrollY; const dtS = Math.max(0.008, (now - lastT) / 1000);
      scrollV = smoothVelocity(scrollV, (y - lastY) / dtS); lastY = y; lastT = now;
      const cin = document.getElementById('cinema');
      const want = !document.hidden && (cin ? cin.getBoundingClientRect().bottom < window.innerHeight * 0.4 : true);
      if (want === active) return;
      active = want; cv.style.opacity = want ? '1' : '0';
      if (want) { if (!stopFrame) stopFrame = director.frame(draw); } else { stopFrame?.(); stopFrame = null; ctx.clearRect(0, 0, w, h); }
    };

    // Mouse and pen only. Passive, never prevents default, never touches the canvas's pointer-events.
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; if (!hasPointer) { hasPointer = true; lpx = px; lpy = py; } };
    const onLeave = () => { hasPointer = false; };

    resize(); sync();
    const offResize = director.onResize(resize); const offScroll = director.onScroll(sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', onMove, { passive: true }); document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      offResize(); offScroll(); document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave);
      stopFrame?.(); stopFrame = null; changeKind.current = null; ctx.clearRect(0, 0, w, h); cv.style.opacity = '0';
    };
  }, [enabled, tier]);

  // Season changes do not rebuild the loop; they hand the new kind to the running effect.
  useEffect(() => { seasonRef.current = season; changeKind.current?.(); }, [season]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[30] h-full w-full" style={{ opacity: 0, transition: 'opacity .6s' }} />;
}
