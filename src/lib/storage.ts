// Safe, versioned LocalStorage with validation and corrupted-data recovery.
export const STORAGE_VERSION = 1;
export const storageKey = (name: string) => `aether:v${STORAGE_VERSION}:${name}`;
const key = storageKey;

export function loadStored<T>(name: string, fallback: T, validate: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate(parsed)) return parsed;
    // corrupted or outdated: keep a backup copy then reset
    try { window.localStorage.setItem(key(name) + ':corrupt', raw); window.localStorage.removeItem(key(name)); } catch {}
    return fallback;
  } catch {
    try { window.localStorage.removeItem(key(name)); } catch {}
    return fallback;
  }
}
export function saveStored<T>(name: string, value: T): boolean {
  try { window.localStorage.setItem(key(name), JSON.stringify(value)); return true; } catch { return false; }
}
export function clearAllStored() {
  try { Object.keys(window.localStorage).filter((k) => k.startsWith('aether:')).forEach((k) => window.localStorage.removeItem(k)); } catch {}
}
