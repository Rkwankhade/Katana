import { storageKey } from './storage';
import { DEFAULT_PREFS, PREFS_NAME, mergePrefs, normalizePrefs, type PreferencePatch, type Preferences } from './preferences-core';

// A tiny external store consumed with useSyncExternalStore. The server snapshot is always DEFAULT_PREFS, so server HTML and the
// first client render agree; React then switches to the stored snapshot right after hydration without a mismatch.

const KEY = storageKey(PREFS_NAME);
let cache: Preferences | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function readStored(): Preferences {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { return normalizePrefs(null); } // storage blocked (privacy mode, disabled cookies)
  if (raw === null) return normalizePrefs(null);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch {
    // Not JSON at all: keep a copy for recovery, then fall back to defaults. The bad value is overwritten on the next save.
    try { window.localStorage.setItem(KEY + ':corrupt', raw); } catch { /* quota or blocked: the backup is best effort */ }
    return normalizePrefs(null);
  }
  return normalizePrefs(parsed); // field-wise: missing, wrong-typed or outdated fields fall back individually
}

function persist(p: Preferences): boolean {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch { return false; } // changes still apply for this session
}

const emit = () => listeners.forEach((l) => l());

const onStorage = (e: StorageEvent) => {
  if (e.key !== null && e.key !== KEY) return; // null means storage was cleared
  cache = readStored(); emit();
};

export const preferencesStore = {
  getServerSnapshot: (): Preferences => DEFAULT_PREFS,
  getSnapshot: (): Preferences => { if (cache === null) cache = readStored(); return cache; },
  subscribe: (l: () => void) => {
    listeners.add(l);
    if (!storageBound) { window.addEventListener('storage', onStorage); storageBound = true; }
    return () => {
      listeners.delete(l);
      if (listeners.size === 0 && storageBound) { window.removeEventListener('storage', onStorage); storageBound = false; }
    };
  },
  update: (patch: PreferencePatch) => { cache = mergePrefs(preferencesStore.getSnapshot(), patch); persist(cache); emit(); },
  reset: () => { cache = normalizePrefs(null); persist(cache); emit(); },
};
