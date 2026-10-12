// One shared IntersectionObserver for decorative "is this on screen yet?" effects (crest accents, hanko stamps).
// Existing Reveal and Header observers are left alone; anything new goes through here so there is exactly one extra observer,
// created with the first subscriber and disconnected with the last.

type Cb = (visible: boolean) => void;
interface Sub { min: number; cb: Cb; last: boolean | null }

const THRESHOLDS = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
const subs = new Map<Element, Set<Sub>>();
let io: IntersectionObserver | null = null;

function ensure(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const set = subs.get(e.target); if (!set) continue;
        // copy: a callback may unsubscribe while we iterate
        for (const sub of [...set]) {
          const visible = e.isIntersecting && e.intersectionRatio >= sub.min;
          if (visible !== (sub.last ?? false)) { sub.last = visible; sub.cb(visible); } // an initial "not visible" is not an event
        }
      }
    }, { threshold: THRESHOLDS });
  }
  return io;
}

/**
 * Calls cb(true/false) as `el` enters or leaves the viewport, where "visible" means at least `min` of it (0..1, use one of THRESHOLDS) is showing.
 * `fallback` is the answer when IntersectionObserver does not exist: true for effects that only reveal (stamps), false for ones that only animate.
 * Returns an unsubscribe function.
 */
export function observeVisibility(el: Element, cb: Cb, opts: { min?: number; fallback?: boolean } = {}): () => void {
  if (typeof IntersectionObserver === 'undefined') { cb(opts.fallback ?? false); return () => {}; }
  const sub: Sub = { min: opts.min ?? 0, cb, last: null };
  let set = subs.get(el);
  if (!set) { set = new Set(); subs.set(el, set); ensure().observe(el); }
  set.add(sub);
  return () => {
    const s = subs.get(el); if (!s) return;
    s.delete(sub);
    if (s.size === 0) { subs.delete(el); io?.unobserve(el); }
    if (subs.size === 0 && io) { io.disconnect(); io = null; }
  };
}
