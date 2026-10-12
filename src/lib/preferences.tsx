'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { preferencesStore } from './preferences-store';
import { capabilityStore, reducedMotionStore } from './environment';
import { resolveSeason, tierFromPref, type PreferencePatch, type Preferences, type Season, type Tier } from './preferences-core';

export type { Preferences, PreferencePatch, Season, Tier } from './preferences-core';

interface PrefsCtx { prefs: Preferences; update: (patch: PreferencePatch) => void; reset: () => void }
interface MotionCtx {
  /** True when animation is welcome: neither the operating system nor the Calm setting asks for less motion. */
  motionOK: boolean;
  systemReduced: boolean;
  calm: boolean;
  /** Effective tier: the saved performance override, otherwise the detected tier. */
  tier: Tier;
  detectedTier: Tier;
  detectedReasons: string[];
}
const PrefsContext = createContext<PrefsCtx | null>(null);
const MotionContext = createContext<MotionCtx | null>(null);

/**
 * Mount once, high in the tree (the root layout does). Server and first client render use defaults; stored values arrive right after
 * hydration through useSyncExternalStore, so there is no hydration mismatch. The inline boot script has already set the same
 * attributes on <html> before paint, which is what prevents a visual flash.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(preferencesStore.subscribe, preferencesStore.getSnapshot, preferencesStore.getServerSnapshot);
  const systemReduced = useSyncExternalStore(reducedMotionStore.subscribe, reducedMotionStore.getSnapshot, reducedMotionStore.getServerSnapshot);
  const cap = useSyncExternalStore(capabilityStore.subscribe, capabilityStore.getSnapshot, capabilityStore.getServerSnapshot);

  const calm = prefs.motion === 'calm';
  const motionOK = !systemReduced && !calm;
  const tier: Tier = tierFromPref(prefs.performance) ?? cap.tier;
  const season = useSeason();

  // Mirror the effective state onto <html> so CSS can react (kept identical to the boot script's attributes).
  useEffect(() => {
    const d = document.documentElement;
    d.setAttribute('data-calm', calm ? 'true' : 'false');
    d.setAttribute('data-tier', String(tier));
    d.setAttribute('data-still', !motionOK || tier === 0 ? 'true' : 'false');
    d.setAttribute('data-mode', prefs.mode);
    d.setAttribute('data-season', season);
  }, [calm, motionOK, tier, prefs.mode, season]);

  const update = useCallback((patch: PreferencePatch) => preferencesStore.update(patch), []);
  const reset = useCallback(() => preferencesStore.reset(), []);
  const prefsValue = useMemo<PrefsCtx>(() => ({ prefs, update, reset }), [prefs, update, reset]);
  const motionValue = useMemo<MotionCtx>(
    () => ({ motionOK, systemReduced, calm, tier, detectedTier: cap.tier, detectedReasons: cap.reasons }),
    [motionOK, systemReduced, calm, tier, cap],
  );
  return <PrefsContext.Provider value={prefsValue}><MotionContext.Provider value={motionValue}>{children}</MotionContext.Provider></PrefsContext.Provider>;
}

export function usePreferences(): PrefsCtx {
  const c = useContext(PrefsContext);
  if (!c) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return c;
}
function useMotionCtx(): MotionCtx {
  const c = useContext(MotionContext);
  if (!c) throw new Error('Motion hooks must be used inside <PreferencesProvider>');
  return c;
}

/** The single answer to "may I animate?". Respects the OS reduced-motion setting and the site's Calm setting. */
export const useMotionOK = (): boolean => useMotionCtx().motionOK;
/** Effective capability tier (0 static, 1 reduced, 2 full). Independent of motion preference; combine with useMotionOK as needed. */
export const useTier = (): Tier => useMotionCtx().tier;
/** Full motion state, mainly for the settings UI. */
export const useMotionState = (): MotionCtx => useMotionCtx();
/**
 * Resolved season ("auto" becomes the season for the visitor's local month and saved hemisphere).
 * The server snapshot is always "spring", so server markup never depends on the build date and hydration cannot mismatch;
 * the real season arrives right after hydration. Visuals that must be right before then are driven by html[data-season],
 * which the inline boot script sets before first paint.
 */
const seasonSnapshot = (): Season => { const p = preferencesStore.getSnapshot(); return resolveSeason(p.season, new Date(), p.hemisphere); };
const serverSeason = (): Season => 'spring';
export function useSeason(): Season { return useSyncExternalStore(preferencesStore.subscribe, seasonSnapshot, serverSeason); }

const noopSubscribe = () => () => {};
/** False during server render and hydration, true from the render that follows hydration. */
export function useHydrated(): boolean { return useSyncExternalStore(noopSubscribe, () => true, () => false); }
