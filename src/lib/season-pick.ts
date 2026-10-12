/**
 * Resolves the season to show. Pure and self-contained: it is serialised with Function#toString into the inline boot script
 * (see bootScript.ts), so it must not reference anything outside itself and must use plain syntax.
 *
 *  pref        "spring" | "summer" | "autumn" | "winter" win outright; anything else (including "auto" and junk) means Auto.
 *  hemisphere  "south" shifts the calendar by six months; anything else is treated as northern.
 *  month       0..11 from the visitor's local clock. An invalid month falls back to spring (the site's established look).
 */
export function pickSeason(pref: unknown, hemisphere: unknown, month: unknown): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (pref === 'spring' || pref === 'summer' || pref === 'autumn' || pref === 'winter') return pref;
  if (typeof month !== 'number' || !(month >= 0 && month < 12)) return 'spring';
  let m = Math.floor(month);
  if (hemisphere === 'south') m = (m + 6) % 12;
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}
