// Pure particle rules shared by Petals.tsx: which particle each season uses, how many, and the force and fade maths.
// No DOM access, so it is unit-tested in Node.
import type { Season, Tier } from './preferences-core';

export type ParticleKind = 'petal' | 'leaf' | 'snow' | 'firefly';

const KIND_BY_SEASON: Record<Season, ParticleKind> = { spring: 'petal', summer: 'firefly', autumn: 'leaf', winter: 'snow' };
export const kindForSeason = (s: Season): ParticleKind => KIND_BY_SEASON[s] ?? 'petal';

/** Base budgets on tier 2: [desktop, narrow viewport]. Petals keep the Phase 1 numbers; the rest stay at or below them. */
const BUDGET: Record<ParticleKind, [number, number]> = { petal: [18, 9], leaf: [14, 7], snow: [24, 12], firefly: [10, 5] };
/** Tier 0 gets none (static). Tier 1 gets half, rounded up. */
export function particleCount(kind: ParticleKind, viewportWidth: number, tier: Tier): number {
  if (tier === 0) return 0;
  const [desktop, narrow] = BUDGET[kind];
  const base = viewportWidth < 768 ? narrow : desktop;
  return tier === 1 ? Math.ceil(base / 2) : base;
}

/** Canvas colours per kind (canvas cannot read CSS custom properties without timing hazards). Petal colours are the original Phase 1 values. */
export const PARTICLE_COLORS: Record<ParticleKind, string[]> = {
  petal: ['#f6bfcf', '#fbd7e1'],
  leaf: ['#c8641e', '#e0902f', '#a63f16', '#d9a441'],
  snow: ['#f2f6fb', '#dbe6f2'],
  firefly: ['#d8f08a', '#a6e8a0'],
};

// ---- pointer: air displacement, not collision ----
export const POINTER_RADIUS = 120; // CSS pixels
const POINTER_MAX_SPEED = 1400; // px/s of pointer travel that counts as a full stir
export const POINTER_MAX_PUSH_SPEED = 170; // px/s cap on the extra velocity a particle can pick up

/** Acceleration (px/s^2) on a particle at offset (dx, dy) from the pointer. Zero outside the radius; smoothstep falloff inside. */
export function pointerPush(dx: number, dy: number, pointerSpeed: number): { ax: number; ay: number } {
  const d = Math.hypot(dx, dy);
  if (!(d < POINTER_RADIUS)) return { ax: 0, ay: 0 };
  const k = 1 - d / POINTER_RADIUS;
  const falloff = k * k * (3 - 2 * k);
  const stir = Math.min(1, Math.max(0, pointerSpeed) / POINTER_MAX_SPEED);
  const mag = (70 + 260 * stir) * falloff;
  if (d < 0.001) return { ax: 0, ay: -mag }; // exactly under the pointer: lift gently instead of dividing by zero
  return { ax: (dx / d) * mag, ay: (dy / d) * mag };
}

/** Exponential damping: velocities relax toward zero, so displaced particles drift back to their own motion. */
export const damp = (v: number, dt: number, rate = 2.4) => v * Math.exp(-rate * dt);
export function clampMag(x: number, y: number, max: number): { x: number; y: number } {
  const m = Math.hypot(x, y);
  return m > max ? { x: (x / m) * max, y: (y / m) * max } : { x, y };
}

// ---- scroll: velocity becomes a gentle, clamped wind ----
export const smoothVelocity = (prev: number, raw: number, k = 0.35) => prev + (raw - prev) * k;
/** -1 (scrolling up fast) .. +1 (scrolling down fast). Non-finite input gives 0. */
export const scrollWind = (pxPerSec: number) => (Number.isFinite(pxPerSec) ? Math.min(1, Math.max(-1, pxPerSec / 2200)) : 0);
/** Vertical px/s added to a particle. depth 0..1: larger or nearer particles feel more wind. Max +-55 px/s. */
export const windY = (wind: number, depth: number) => Math.min(1, Math.max(-1, wind)) * 55 * (0.6 + 0.4 * Math.min(1, Math.max(0, depth)));

// ---- fades used when the season (and so the particle kind) changes ----
export const FADE_SECONDS = 1.4;
/** dir +1 fades in, -1 fades out; result stays within 0..1. */
export const stepFade = (f: number, dt: number, dir: 1 | -1) => Math.min(1, Math.max(0, f + (dir * dt) / FADE_SECONDS));
