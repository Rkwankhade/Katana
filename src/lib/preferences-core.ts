// Pure preferences model. No browser access, so it can run on the server, in the browser and in the Node test runner.
import { pickSeason } from './season-pick';

export const PREFS_NAME = 'prefs'; // stored under "aether:v1:prefs" by src/lib/storage.ts
export const PREFS_SCHEMA = 1;

export type BrowsingMode = 'fast' | 'story';
export type SeasonPref = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
export type Season = Exclude<SeasonPref, 'auto'>;
export type Hemisphere = 'north' | 'south';
export type MotionPref = 'system' | 'calm';
export type NarrationPref = 'captions' | 'captions-voice';
/** Manual override of the detected capability tier. "auto" trusts detection. */
export type PerformancePref = 'auto' | 'full' | 'light' | 'static';
export type Tier = 0 | 1 | 2;

/** Placeholder ambient layers. The audio engine is a later phase; levels are stored now so the contract is stable. */
export const AMBIENT_IDS = ['wind', 'rain', 'water', 'insects', 'temple'] as const;
export type AmbientId = (typeof AMBIENT_IDS)[number];

export interface AudioPrefs {
  /** Ambient sound on/off. Never true by default and never auto-started. */
  enabled: boolean;
  /** Master volume 0..1, applies to ambient sound and sound effects. */
  master: number;
  ambient: Record<AmbientId, number>;
  /** Sound effects on/off. */
  sfx: boolean;
}

export interface Preferences {
  schema: number;
  mode: BrowsingMode;
  season: SeasonPref;
  /** Used only when season is "auto". */
  hemisphere: Hemisphere;
  audio: AudioPrefs;
  motion: MotionPref;
  narration: NarrationPref;
  performance: PerformancePref;
}

export type PreferencePatch = Partial<Omit<Preferences, 'audio' | 'schema'>> & {
  audio?: Partial<Omit<AudioPrefs, 'ambient'>> & { ambient?: Partial<Record<AmbientId, number>> };
};

export const MODES: readonly BrowsingMode[] = ['fast', 'story'];
export const SEASONS: readonly SeasonPref[] = ['auto', 'spring', 'summer', 'autumn', 'winter'];
export const HEMISPHERES: readonly Hemisphere[] = ['north', 'south'];
export const MOTIONS: readonly MotionPref[] = ['system', 'calm'];
export const NARRATIONS: readonly NarrationPref[] = ['captions', 'captions-voice'];
export const PERFORMANCES: readonly PerformancePref[] = ['auto', 'full', 'light', 'static'];

export const DEFAULT_PREFS: Preferences = {
  schema: PREFS_SCHEMA,
  mode: 'fast',
  season: 'auto',
  hemisphere: 'north',
  audio: { enabled: false, master: 0.6, ambient: { wind: 0.5, rain: 0.5, water: 0.5, insects: 0.5, temple: 0.5 }, sfx: false },
  motion: 'system',
  narration: 'captions',
  performance: 'auto',
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const level = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.min(1, Math.max(0, v)) * 100) / 100 : fallback);

/**
 * Turns any value (missing, malformed, from an older schema, hand-edited) into a valid Preferences object.
 * Each field is validated on its own, so one bad field never discards the others.
 */
export function normalizePrefs(raw: unknown): Preferences {
  const d = DEFAULT_PREFS;
  if (!isObj(raw)) return cloneDefaults();
  const a = isObj(raw.audio) ? raw.audio : {};
  const am = isObj(a.ambient) ? a.ambient : {};
  const ambient = {} as Record<AmbientId, number>;
  for (const id of AMBIENT_IDS) ambient[id] = level(am[id], d.audio.ambient[id]);
  return {
    schema: PREFS_SCHEMA,
    mode: oneOf(MODES, raw.mode, d.mode),
    season: oneOf(SEASONS, raw.season, d.season),
    hemisphere: oneOf(HEMISPHERES, raw.hemisphere, d.hemisphere),
    audio: { enabled: bool(a.enabled, d.audio.enabled), master: level(a.master, d.audio.master), ambient, sfx: bool(a.sfx, d.audio.sfx) },
    motion: oneOf(MOTIONS, raw.motion, d.motion),
    narration: oneOf(NARRATIONS, raw.narration, d.narration),
    performance: oneOf(PERFORMANCES, raw.performance, d.performance),
  };
}

export function cloneDefaults(): Preferences {
  return { ...DEFAULT_PREFS, audio: { ...DEFAULT_PREFS.audio, ambient: { ...DEFAULT_PREFS.audio.ambient } } };
}

/** Applies a partial update and re-validates the result. */
export function mergePrefs(base: Preferences, patch: PreferencePatch): Preferences {
  const { audio, ...rest } = patch;
  return normalizePrefs({ ...base, ...rest, audio: audio ? { ...base.audio, ...audio, ambient: { ...base.audio.ambient, ...(audio.ambient ?? {}) } } : base.audio });
}

/** Meteorological seasons from the visitor's local month. An explicit season always wins; an invalid date falls back to spring. */
export function resolveSeason(pref: SeasonPref, now: Date = new Date(), hemisphere: Hemisphere = 'north'): Season {
  return pickSeason(pref, hemisphere, now.getMonth());
}

/** Maps the manual performance override to a tier, or null when detection should decide. */
export function tierFromPref(p: PerformancePref): Tier | null {
  return p === 'full' ? 2 : p === 'light' ? 1 : p === 'static' ? 0 : null;
}
