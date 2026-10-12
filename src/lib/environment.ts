import { detectCapability, type Capability } from './capability';
import { onResize } from './scrollHub';

// Browser-environment stores for useSyncExternalStore. Server snapshots assume the full experience and no reduced-motion request;
// the inline boot script (bootScript.ts) already put the correct attributes on <html>, so CSS is right before React catches up.

const RM_QUERY = '(prefers-reduced-motion: reduce)';

// ---- system reduced motion ----
export const reducedMotionStore = {
  getServerSnapshot: () => false,
  getSnapshot: () => (typeof window.matchMedia === 'function' ? window.matchMedia(RM_QUERY).matches : false),
  subscribe: (cb: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {};
    const m = window.matchMedia(RM_QUERY);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  },
};

// ---- capability ----
const SERVER_CAPABILITY: Capability = { tier: 2, reasons: [] };
let capability: Capability | null = null;
const capListeners = new Set<() => void>();
let timer = 0;
let unbindResize: (() => void) | null = null;

// Network Information API: Chromium-only and sometimes partial, so treat it as optional and only use it if it is a real event source.
type Conn = { addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
const connection = (): Conn | null => { const n = navigator as Navigator & { connection?: Conn; mozConnection?: Conn; webkitConnection?: Conn }; return n.connection || n.mozConnection || n.webkitConnection || null; };
const watchConnection = (on: boolean) => { const c = connection(); if (!c) return; if (on) c.addEventListener?.('change', schedule); else c.removeEventListener?.('change', schedule); };

function recompute() {
  const next = detectCapability(window);
  const prev = capability;
  if (prev && prev.tier === next.tier && prev.reasons.join() === next.reasons.join()) return; // keep identity so subscribers do not re-render
  capability = next; capListeners.forEach((l) => l());
}
const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(recompute, 200); }; // debounce resize storms

export const capabilityStore = {
  getServerSnapshot: (): Capability => SERVER_CAPABILITY,
  getSnapshot: (): Capability => { if (capability === null) capability = detectCapability(window); return capability; },
  subscribe: (cb: () => void) => {
    capListeners.add(cb);
    if (!unbindResize) { unbindResize = onResize(schedule); watchConnection(true); }
    return () => {
      capListeners.delete(cb);
      if (capListeners.size === 0 && unbindResize) { unbindResize(); unbindResize = null; watchConnection(false); window.clearTimeout(timer); }
    };
  },
};
