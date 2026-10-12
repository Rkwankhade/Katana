// Geometry for the katana, in a 1000 x 170 viewBox, drawn horizontally: hilt left, blade right, edge up.
// Pure and deterministic (server and client produce identical markup), and unit-tested for physical plausibility.
//
// The blade's centre line is a circular arc (sori) of radius R. Edge-up, a katana is a shallow bowl: the ends sit higher than the middle.
// Because the whole hilt-and-blade group is rotated about the arc's centre, the blade follows its own curve out of the equally curved
// saya instead of sliding straight through it. That is why the draw is a small rotation, not a translation.

export const VB_W = 1000;
export const VB_H = 170;
export const R = 3600; // radius of the blade's curve (about 2% sori over the blade length)
export const XM = 540; // x of the arc's lowest point
export const CY = 92; // centre line y at XM
export const CENTER = { x: XM, y: CY - R }; // rotation centre for the draw (far above the sword)

/** Centre line y at x. Ends are higher (smaller y) than the middle. */
export const cy = (x: number): number => CY - (R - Math.sqrt(R * R - (x - XM) * (x - XM)));

// ---- construction, left to right ----
export const KASHIRA = [100, 120] as const; // pommel cap
export const TSUKA = [118, 296] as const; // handle
export const FUCHI = [296, 308] as const; // handle collar
export const TSUBA_X = 316; // guard
export const HABAKI = [328, 350] as const; // blade collar (sits inside the saya at rest)
export const BLADE = [350, 936] as const; // visible blade, habaki end to tip
export const SAYA = [326, 962] as const; // scabbard, mouth to end
export const BLADE_HALF = 15; // half the blade's height
export const BLADE_LEN = BLADE[1] - TSUBA_X; // tsuba to tip, the length the draw is measured against

/** The blade comes out about 15% of its length. */
export const DRAW_RATIO = 0.15;
export const TRAVEL = DRAW_RATIO * BLADE_LEN; // arc length the hilt group moves along the curve
export const DRAW_DEG = (TRAVEL / R) * (180 / Math.PI); // rotation about CENTER

const f = (n: number): number => Math.round(n * 10) / 10;
type Off = number | ((x: number) => number);
const at = (o: Off, x: number) => (typeof o === 'number' ? o : o(x));

/** Samples x0..x1 (always including both ends). */
function xs(x0: number, x1: number, step: number): number[] {
  const out: number[] = []; for (let x = x0; x < x1; x += step) out.push(x); out.push(x1); return out;
}

/** Closed strip that follows the arc between two offsets (negative = toward the edge side / up). */
export function strip(x0: number, x1: number, top: Off, bottom: Off, step = 12): string {
  const pts = xs(x0, x1, step);
  const t = pts.map((x) => `${f(x)} ${f(cy(x) + at(top, x))}`);
  const b = pts.slice().reverse().map((x) => `${f(x)} ${f(cy(x) + at(bottom, x))}`);
  return `M${t.join(' L')} L${b.join(' L')}Z`;
}
/** Open polyline that follows the arc at an offset. */
export function line(x0: number, x1: number, off: Off, step = 12): string {
  return `M${xs(x0, x1, step).map((x) => `${f(x)} ${f(cy(x) + at(off, x))}`).join(' L')}`;
}

// ---- blade ----
const KISSAKI = 52; // length of the point
const kt = (x: number) => Math.max(0, Math.min(1, (x - (BLADE[1] - KISSAKI)) / KISSAKI));
/** Wavy boundary of the hardened edge (hamon): a soft notare with a little gunome. Offsets are from the centre line. */
export const hamonOffset = (x: number): number => -3 + 2.4 * Math.sin(x / 9.5) + 1.5 * Math.sin(x / 4.1 + 1);

export const bladeSilhouette = (): string => strip(BLADE[0], BLADE[1], (x) => -BLADE_HALF + 19 * Math.pow(kt(x), 1.6), (x) => BLADE_HALF - 11 * Math.pow(kt(x), 3), 12);
export const bladeFacets = {
  spine: strip(BLADE[0], BLADE[1] - KISSAKI, 8, BLADE_HALF),
  bevel: strip(BLADE[0], BLADE[1] - KISSAKI, -BLADE_HALF, -BLADE_HALF + 3.6),
  yakiba: strip(BLADE[0], BLADE[1] - KISSAKI, -BLADE_HALF + 3.6, hamonOffset, 4),
};
export const hamonLine = line(BLADE[0], BLADE[1] - KISSAKI, hamonOffset, 4);
export const edgeLine = line(BLADE[0], BLADE[1] - KISSAKI, -BLADE_HALF + 0.8);
/** Short stretch of edge the glint travels along (normalised with pathLength=100 in the markup). */
export const glintPath = line(BLADE[0] + 4, BLADE[0] + 150, -BLADE_HALF + 0.6);
export const shinogiLine = line(BLADE[0], BLADE[1] - KISSAKI, 2.5);

/** Kurikara: a dragon coiled around an upright sword, engraved in the lower half of the blade just past the habaki. */
export function kurikara(): { ken: string; body: string; head: string; glow: string } {
  const x0 = BLADE[0] + 8; const x1 = x0 + 46; const mid = 6.5;
  const bodyPts = xs(x0, x1, 2).map((x) => { const t = (x - x0) / (x1 - x0); return `${f(x)} ${f(cy(x) + mid + 3.4 * Math.sin(t * Math.PI * 3 + 0.5))}`; });
  const hx = x1; const hy = cy(hx) + mid + 3.4 * Math.sin(Math.PI * 3 + 0.5);
  return {
    ken: line(x0 - 3, x1 + 4, mid, 6), // the sword the dragon winds around
    body: `M${bodyPts.join(' L')}`,
    // head: snout, jaw and a swept horn, a few units across
    head: `M${f(hx)} ${f(hy)} l4.2 -2.6 l2.4 .4 l-1.6 1.8 l1.4 1.9 l-2.6 .2 l-3.6 -1.7 M${f(hx + 1)} ${f(hy - 1.6)} l-3 -3.4`,
    glow: line(x0 - 3, x1 + 6, mid + 0.8, 6),
  };
}

// ---- virtue markings on the saya ----
export interface MarkSlot { chars: string[]; x: number; size: number }
/** Lays the seven virtues along the saya, evenly spaced, double-character virtues set side by side. */
export function layoutMarks(kanji: readonly string[], from = 392, to = 928): MarkSlot[] {
  const single = 30; const double = 27;
  const widths = kanji.map((k) => (k.length > 1 ? double * k.length : single));
  const gap = (to - from - widths.reduce((a, b) => a + b, 0)) / Math.max(1, kanji.length - 1);
  let x = from;
  return kanji.map((k, i) => { const slot = { chars: Array.from(k), x, size: k.length > 1 ? double : single }; x += widths[i] + gap; return slot; });
}

/** Where the drawn blade's tip ends up on the x axis, for plausibility checks. Rotation about CENTER moves points along their circle. */
export function rotatedX(x: number, deg: number): number {
  const a = (deg * Math.PI) / 180; const dx = x - CENTER.x; const dy = cy(x) - CENTER.y;
  return CENTER.x + dx * Math.cos(a) - dy * Math.sin(a);
}
