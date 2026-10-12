import { detectCapability } from './capability';
import { pickSeason } from './season-pick';

/**
 * Inline script placed in <head> by the root layout. It runs before first paint and before hydration, and only sets
 * attributes on <html> so CSS can already match the visitor's saved Calm choice and capability tier. This is what keeps
 * the Calm and static layouts from flashing in after hydration. React state is still seeded from the same sources afterwards.
 *
 *   data-calm="true|false"   Calm motion preference saved by the visitor
 *   data-tier="0|1|2"        effective capability tier (saved override, else detection)
 *   data-still="true|false"  true when the cinematic should be static (Calm, system reduced motion, or tier 0)
 *   data-season="spring|summer|autumn|winter"  resolved season (saved choice, or Auto from the local month and saved hemisphere)
 *
 * The storage key and field names mirror preferences-core.ts (PREFS_NAME, `motion`, `performance`, `season`, `hemisphere`) and src/lib/storage.ts.
 * Only the two operations that can legitimately throw (storage access, matchMedia) are guarded, and only narrowly.
 */
export function buildBootScript(): string {
  return `(function(){
var d=document.documentElement;
var detect=${detectCapability.toString()};
var pick=${pickSeason.toString()};
var calm=false,perf='auto',sys=false,seasonPref='auto',hemi='north';
try{var raw=window.localStorage.getItem('aether:v1:prefs');if(raw){var p=JSON.parse(raw);if(p&&typeof p==='object'){if(p.motion==='calm')calm=true;if(p.performance==='full'||p.performance==='light'||p.performance==='static')perf=p.performance;seasonPref=p.season;hemi=p.hemisphere;}}}catch(e){/* storage blocked or value not JSON: use defaults */}
try{sys=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){/* matchMedia unavailable */}
var tier=perf==='full'?2:perf==='light'?1:perf==='static'?0:detect(window).tier;
d.setAttribute('data-season',pick(seasonPref,hemi,new Date().getMonth()));
d.setAttribute('data-calm',calm?'true':'false');
d.setAttribute('data-tier',String(tier));
d.setAttribute('data-still',(calm||sys||tier===0)?'true':'false');
})();`;
}

export const BOOT_SCRIPT = buildBootScript();
