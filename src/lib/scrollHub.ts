// Shared, coalesced scroll and resize hubs. No GSAP import, so pages that never load GSAP (privacy, terms) do not pay for it.
//
// One passive window listener per event, attached with the first subscriber and removed with the last. Events are coalesced:
// subscribers run at most once per frame. How "next frame" is scheduled is pluggable: the default is a single requestAnimationFrame
// shared by every subscriber; lib/director.ts swaps in the GSAP ticker when GSAP is on the page so everything runs on one ticker.

type Cancel = () => void;
type Scheduler = (run: () => void) => Cancel;

const rafScheduler: Scheduler = (run) => {
  if (typeof window.requestAnimationFrame === 'function') { const id = window.requestAnimationFrame(run); return () => window.cancelAnimationFrame(id); }
  const id = window.setTimeout(run, 16); // environments without rAF
  return () => window.clearTimeout(id);
};
let schedule: Scheduler = rafScheduler;
export function setFlushScheduler(s: Scheduler) { schedule = s; }

function makeHub(eventName: 'scroll' | 'resize') {
  const subs = new Set<() => void>();
  let attached = false;
  let cancel: Cancel | null = null;
  const flush = () => { cancel = null; subs.forEach((s) => s()); };
  const onEvent = () => { if (!cancel) cancel = schedule(flush); };
  return (fn: () => void): (() => void) => {
    subs.add(fn); // a Set: subscribing the same function twice is a no-op
    if (!attached) { window.addEventListener(eventName, onEvent, { passive: true }); attached = true; }
    return () => {
      subs.delete(fn);
      if (subs.size === 0 && attached) {
        window.removeEventListener(eventName, onEvent); attached = false;
        if (cancel) { cancel(); cancel = null; }
      }
    };
  };
}

export const onScroll = makeHub('scroll');
export const onResize = makeHub('resize');
