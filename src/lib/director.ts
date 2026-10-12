import { gsap } from 'gsap';
import { onResize, onScroll, setFlushScheduler } from './scrollHub';

/**
 * Shared animation director (home page experience; imports GSAP).
 *
 * - frame(fn): per-frame work runs on GSAP's ticker, the same loop ScrollTrigger and every tween already use, so the page never
 *   has several competing requestAnimationFrame loops. The callback receives (deltaMs, timeMs). Returns an unsubscribe function.
 * - onScroll(fn) / onResize(fn): one shared window listener per event (see scrollHub.ts), coalesced to one run per frame. Importing
 *   this module moves their flush onto the GSAP ticker.
 *
 * Nothing runs while nobody is subscribed. Subscribing the same function twice is a no-op, so effects that re-run cannot stack work.
 * ScrollTrigger keeps its own scroll handling; the hubs are for plain UI (header, progress, particles), not for pinned or scrubbed scenes.
 */

setFlushScheduler((run) => {
  const cb = () => { gsap.ticker.remove(cb); run(); };
  gsap.ticker.add(cb);
  return () => gsap.ticker.remove(cb);
});

type FrameFn = (deltaMs: number, timeMs: number) => void;
const frames = new Map<FrameFn, gsap.TickerCallback>();

function frame(fn: FrameFn): () => void {
  if (!frames.has(fn)) {
    const cb: gsap.TickerCallback = (time, deltaTime) => fn(deltaTime, time * 1000);
    frames.set(fn, cb);
    gsap.ticker.add(cb);
  }
  return () => {
    const cb = frames.get(fn);
    if (cb) { gsap.ticker.remove(cb); frames.delete(fn); }
  };
}

export const director = { frame, onScroll, onResize };
