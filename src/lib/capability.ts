export interface Capability { tier: 0 | 1 | 2; reasons: string[] }

/**
 * Estimates a performance tier from browser hints. These are hints, never measurements:
 *  - Tier 0: static artwork and poster, no continuous particles or video scrubbing.
 *  - Tier 1: reduced animation and particle counts.
 *  - Tier 2: the full cinematic experience.
 *
 * Tier 0 needs an explicit signal (data saver, reduced-data, a 2G connection) or a very weak device.
 * One weak hint alone only ever lowers the result when a second hint agrees. Unknown or unsupported APIs count as "no signal".
 *
 * IMPORTANT: this function is serialised with Function#toString into the inline boot script (see bootScript.ts), so it must stay
 * self-contained: no references to module-level values, helpers or imports, and plain syntax only.
 */
export function detectCapability(win: unknown): Capability {
  const reasons: string[] = [];
  const w = (win || {}) as {
    navigator?: { connection?: unknown; mozConnection?: unknown; webkitConnection?: unknown; deviceMemory?: unknown; hardwareConcurrency?: unknown };
    innerWidth?: unknown; matchMedia?: (q: string) => { matches: boolean };
  };
  const nav = w.navigator || {};
  const conn = (nav.connection || nav.mozConnection || nav.webkitConnection || null) as { saveData?: unknown; effectiveType?: unknown } | null;
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 0; // 0 = unknown
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 0; // 0 = unknown
  const width = typeof w.innerWidth === 'number' ? w.innerWidth : 0;
  const net = conn && typeof conn.effectiveType === 'string' ? conn.effectiveType : '';

  // Explicit signals from the user or the network.
  if (conn && conn.saveData === true) reasons.push('data-saver');
  if (net === 'slow-2g' || net === '2g') reasons.push('slow-network');
  if (typeof w.matchMedia === 'function' && w.matchMedia('(prefers-reduced-data: reduce)').matches) reasons.push('reduced-data');
  // Very weak hardware (only when the browser reports it; Safari and Firefox do not).
  if (mem > 0 && mem <= 1) reasons.push('very-low-memory');
  if (mem > 0 && mem <= 2 && cores > 0 && cores <= 2) reasons.push('low-memory-and-cores');
  if (reasons.length) return { tier: 0, reasons: reasons };

  // Soft hints: two must agree before the experience is reduced.
  const soft: string[] = [];
  if (mem > 0 && mem <= 4) soft.push('low-memory');
  if (cores > 0 && cores <= 4) soft.push('few-cores');
  if (width > 0 && width < 768) soft.push('small-viewport');
  if (net === '3g') soft.push('slow-ish-network');
  if (soft.length >= 2) return { tier: 1, reasons: soft };
  return { tier: 2, reasons: soft };
}
