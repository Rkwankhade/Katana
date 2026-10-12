// Tiny synthesised sound effects. There was no audio engine in the project, so this is the one place audio is created.
//
// Rules, enforced here rather than at call sites:
//  - Nothing plays unless the caller says sound effects are enabled (the visitor's preference, off by default).
//  - The AudioContext is created lazily inside play(), which callers only reach from a click or key handler (a user gesture),
//    so autoplay policies are satisfied and nothing exists until the visitor asks for a sound.
//  - One context for the page, reused. At most one sound at a time plus a short cooldown, and every node is disconnected when it ends,
//    so repeated interaction cannot pile up audio nodes.
//  - If AudioContext is missing or refuses to start, play() returns false and the visual experience is unaffected.

export interface SfxEnv { createContext: (() => AudioContext | null) | null; now: () => number }
export interface PlayOptions { enabled: boolean; volume: number }

export const COOLDOWN_MS = 900;
const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export function createSfx(env: SfxEnv) {
  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let lastAt = -Infinity;
  let active = 0;

  const done = (node: AudioNode) => { node.disconnect(); };

  /** A drawn blade: a breath of filtered noise sweeping upward, then a faint metallic ring. Quiet by design. */
  function unsheathe(c: AudioContext, vol: number) {
    const t0 = c.currentTime;
    if (!noise) {
      noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.7), c.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(); src.buffer = noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.4;
    bp.frequency.setValueAtTime(900, t0); bp.frequency.exponentialRampToValueAtTime(4200, t0 + 0.55);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol * 0.16, t0 + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
    src.connect(bp); bp.connect(g); g.connect(c.destination);
    const nodes: AudioScheduledSourceNode[] = [src]; const cleanup: AudioNode[][] = [[src, bp, g]];
    for (const hz of [2349, 3729, 5120]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
      const og = c.createGain(); og.gain.setValueAtTime(0.0001, t0 + 0.28); og.gain.linearRampToValueAtTime(vol * 0.018, t0 + 0.3); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
      o.connect(og); og.connect(c.destination); o.start(t0 + 0.28); o.stop(t0 + 1.35);
      nodes.push(o); cleanup.push([o, og]);
    }
    src.start(t0); src.stop(t0 + 0.7);
    active = nodes.length;
    nodes.forEach((n, i) => { n.onended = () => { cleanup[i].forEach(done); active = Math.max(0, active - 1); }; });
  }

  return {
    /** Returns true only if a sound was actually started. */
    play({ enabled, volume }: PlayOptions): boolean {
      const vol = clamp01(volume);
      if (!enabled || vol === 0) return false;
      const now = env.now();
      if (active > 0 || now - lastAt < COOLDOWN_MS) return false;
      if (!ctx) ctx = env.createContext ? env.createContext() : null;
      if (!ctx) return false;
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => { /* autoplay policy refused: stay silent */ });
      lastAt = now;
      unsheathe(ctx, vol);
      return true;
    },
    /** For tests and teardown. */
    stats: () => ({ hasContext: ctx !== null, active }),
  };
}

type WebkitAudio = { webkitAudioContext?: typeof AudioContext };
export const sfx = createSfx({
  createContext: typeof window === 'undefined' ? null : () => { const C = (globalThis as WebkitAudio).webkitAudioContext && !globalThis.AudioContext ? (globalThis as WebkitAudio).webkitAudioContext : globalThis.AudioContext; return C ? new C() : null; },
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
});
