'use client';
import { useEffect, useId, useReducer, useRef, useState } from 'react';
import { useMotionOK, usePreferences, useTier } from '@/lib/preferences';
import { sfx } from '@/lib/sfx';
import { INITIAL_KATANA, drawsOnToggle, isDrawn, isOpen, katanaReduce } from '@/lib/katana-state';
import {
  BLADE, BLADE_HALF, CENTER, DRAW_DEG, FUCHI, HABAKI, KASHIRA, SAYA, TSUBA_X, TSUKA, VB_H, VB_W,
  bladeFacets, bladeSilhouette, cy, edgeLine, glintPath, hamonLine, kurikara, layoutMarks, line, shinogiLine, strip,
} from '@/lib/katana-geometry';
import { VIRTUES } from '@/data/virtues';
import { VIRTUE_GLYPHS } from '@/data/virtue-glyphs';

// Palette: steel and lacquer from the existing katana artwork, gold from the kamon (#d8bd8a / #7a5f2a), amber for light.
const GOLD = '#d8bd8a'; const GOLD_DK = '#7a5f2a'; const AMBER = '#ffe3a8';

// Geometry is pure and deterministic, so it is built once at module load and is identical on server and client.
const SILHOUETTE = bladeSilhouette();
const DRAGON = kurikara();
const MARKS = layoutMarks(VIRTUES.map((v) => v.kanji));
const SAYA_TAPER = (x: number) => 21 - (3 * (x - SAYA[0])) / (SAYA[1] - SAYA[0]);
const SAYA_PATH = strip(SAYA[0], SAYA[1], (x) => -SAYA_TAPER(x), SAYA_TAPER);
const TSUKA_HH = (x: number) => 12.5 + 1.8 * Math.sin((Math.PI * (x - TSUKA[0])) / (TSUKA[1] - TSUKA[0]));
const TSUKA_PATH = strip(TSUKA[0], TSUKA[1], (x) => -TSUKA_HH(x), TSUKA_HH);
const ITO = (() => { // diagonal wrap lattice, kept inside the handle by a clip path
  let d = ''; const w = 17;
  for (let x = TSUKA[0] + 6; x < TSUKA[1]; x += w) {
    d += `M${x} ${cy(x) - 15} L${x + w} ${cy(x + w) + 15} M${x + w} ${cy(x + w) - 15} L${x} ${cy(x) + 15} `;
  }
  return d;
})();

/**
 * An interactive katana drawn from its saya. Hover or keyboard focus draws the blade about 15% of its length; a click or tap toggles
 * it drawn (tap once to draw, again to sheathe). The blade follows its own curve out of the scabbard, a thin glint runs along the
 * exposed edge, the hamon catches the light, the kurikara engraving fades in, then the seven virtue markings appear on the saya one by one.
 *
 * Motion is plain CSS transitions on [data-open] (globals.css), so there is no animation loop and the Calm / reduced-motion / tier-0
 * rules apply for free. In static mode (Calm, system reduced motion, tier 0) the sword is shown drawn with its markings and nothing moves.
 * The seven virtues are always available as text below the sword. The drawing itself is decorative and hidden from assistive technology.
 */
export default function KatanaReveal({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const listId = `katana-virtues-${uid}`;
  const motionOK = useMotionOK(); const tier = useTier();
  const { prefs } = usePreferences();
  const staticMode = !motionOK || tier === 0;
  const [state, dispatch] = useReducer(katanaReduce, INITIAL_KATANA);
  const [ready, setReady] = useState(false);
  const viaPointer = useRef(false); // did the current focus come from a click or tap rather than the keyboard?

  useEffect(() => { setReady(true); }, []);
  // The meaning of "toggled" flips between modes (drawn vs sheathed), so start clean whenever the mode changes.
  useEffect(() => { dispatch({ type: 'reset' }); }, [staticMode]);

  const open = isOpen(state, staticMode);
  const drawn = isDrawn(state, staticMode);

  const onClick = () => {
    const next = katanaReduce(state, { type: 'toggle' });
    dispatch({ type: 'toggle' });
    // One toggle is one click event (Enter, Space, mouse and tap all arrive as click), so one sound at most. Hover and focus never play.
    if (drawsOnToggle(next, staticMode)) sfx.play({ enabled: prefs.audio.sfx, volume: prefs.audio.master });
  };

  const g = (id: string) => `url(#${id}-${uid})`;
  return (
    <div className={`katana-block ${className}`.trim()}>
      <button
        type="button" className="katana" data-open={open} data-drawn={drawn} data-ready={ready ? '' : undefined}
        aria-label="Draw the katana" aria-pressed={drawn} aria-describedby={listId}
        onClick={onClick}
        onPointerEnter={(e) => dispatch({ type: 'pointer-enter', pointerType: e.pointerType })}
        onPointerLeave={() => dispatch({ type: 'pointer-leave' })}
        onPointerDown={() => { viaPointer.current = true; }}
        onKeyDown={() => { viaPointer.current = false; }}
        onFocus={() => dispatch({ type: 'focus', viaPointer: viaPointer.current })}
        onBlur={() => { viaPointer.current = false; dispatch({ type: 'blur' }); }}
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true" focusable="false" style={{ ['--k-deg' as string]: `${DRAW_DEG}deg` }}>
          <defs>
            <radialGradient id={`aura-${uid}`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={AMBER} stopOpacity=".32" /><stop offset=".55" stopColor={GOLD} stopOpacity=".12" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></radialGradient>
            <linearGradient id={`steel-${uid}`} gradientUnits="userSpaceOnUse" x1={BLADE[0]} y1="0" x2={BLADE[1]} y2="0"><stop offset="0" stopColor="#b9c4d3" /><stop offset=".5" stopColor="#8f9bad" /><stop offset="1" stopColor="#7a8699" /></linearGradient>
            <linearGradient id={`lacquer-${uid}`} gradientUnits="userSpaceOnUse" x1={SAYA[0]} y1="0" x2={SAYA[1]} y2="0"><stop offset="0" stopColor="#1d1814" /><stop offset=".5" stopColor="#14110f" /><stop offset="1" stopColor="#0d0b0a" /></linearGradient>
            <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0dcae" /><stop offset=".5" stopColor={GOLD} /><stop offset="1" stopColor={GOLD_DK} /></linearGradient>
            <clipPath id={`tsuka-${uid}`}><path d={TSUKA_PATH} /></clipPath>
          </defs>

          {/* light that answers the reveal: a faint amber bloom around the exposed blade (opacity only) */}
          <ellipse className="k-aura" cx={SAYA[0] - 36} cy={cy(SAYA[0] - 36)} rx="170" ry="58" fill={g('aura')} />

          {/* hilt and blade: one rigid group, rotated about the blade's own arc centre so it follows the curve out of the saya */}
          <g transform={`translate(${CENTER.x} ${CENTER.y})`}>
            <g className="k-draw">
              <g transform={`translate(${-CENTER.x} ${-CENTER.y})`}>
                {/* blade: silhouette, mune (spine), ha (edge bevel), yakiba (hardened edge) below the wavy hamon */}
                <path d={SILHOUETTE} fill={g('steel')} />
                <path d={bladeFacets.spine} fill="#566174" />
                <path d={bladeFacets.yakiba} fill="#dde5ee" />
                <path d={bladeFacets.bevel} fill="#f4f8fc" />
                <path d={shinogiLine} fill="none" stroke="#3f4859" strokeOpacity=".45" strokeWidth=".7" />
                <path d={hamonLine} fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth=".9" />
                <path className="k-hamon-hi" d={hamonLine} fill="none" stroke="#fff6e0" strokeWidth="1.3" strokeLinecap="round" />
                <path d={edgeLine} fill="none" stroke="#ffffff" strokeOpacity=".8" strokeWidth=".8" />
                {/* the glint: one amber dash that travels the exposed edge once per draw */}
                <path className="k-glint" d={glintPath} pathLength={100} fill="none" stroke={AMBER} strokeWidth="1.7" strokeLinecap="round" />
                {/* kurikara: a dragon coiled around an upright sword, engraved as a dark groove with a pale lower lip */}
                <g className="k-engrave" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d={DRAGON.glow} stroke="#eef3f9" strokeOpacity=".55" strokeWidth=".5" />
                  <path d={DRAGON.ken} stroke="#3a4253" strokeWidth=".9" />
                  <path d={DRAGON.body} stroke="#3a4253" strokeWidth="1.5" />
                  <path d={DRAGON.head} stroke="#3a4253" strokeWidth="1.1" />
                </g>
                {/* habaki */}
                <path d={strip(HABAKI[0], HABAKI[1], -(BLADE_HALF + 0.9), BLADE_HALF + 0.9)} fill={g('gold')} />
                <path d={line(HABAKI[0] + 7, HABAKI[1] - 5, 0, 6)} stroke={GOLD_DK} strokeWidth=".7" fill="none" opacity=".7" />
                {/* tsuba: seen edge-on, a gold-rimmed disc with a pair of sukashi cut-outs, flanked by thin seppa */}
                <ellipse cx={TSUBA_X - 6.5} cy={cy(TSUBA_X)} rx="1.6" ry="16" fill={GOLD} />
                <ellipse cx={TSUBA_X + 6.5} cy={cy(TSUBA_X)} rx="1.6" ry="16" fill={GOLD} />
                <ellipse cx={TSUBA_X} cy={cy(TSUBA_X)} rx="7" ry="31" fill={g('gold')} />
                <ellipse cx={TSUBA_X} cy={cy(TSUBA_X)} rx="4.4" ry="27" fill="#2b2217" />
                <ellipse cx={TSUBA_X} cy={cy(TSUBA_X) - 15} rx="1.5" ry="4.6" fill="#0b0d10" /><ellipse cx={TSUBA_X} cy={cy(TSUBA_X) + 15} rx="1.5" ry="4.6" fill="#0b0d10" />
                {/* fuchi, tsuka with black ito wrap, menuki, kashira */}
                <path d={strip(FUCHI[0], FUCHI[1], -14.5, 14.5)} fill={g('gold')} />
                <path d={TSUKA_PATH} fill="#121216" />
                <g clipPath={g('tsuka')}>
                  <path d={ITO} stroke="#2e2e3a" strokeWidth="1.7" fill="none" />
                  <path d={ITO} stroke="#000" strokeOpacity=".5" strokeWidth=".6" fill="none" transform="translate(.8 .8)" />
                </g>
                <path d={line(TSUKA[0] + 2, TSUKA[1] - 2, (x) => -TSUKA_HH(x) + 0.5, 8)} stroke={GOLD} strokeOpacity=".28" strokeWidth=".7" fill="none" />
                <ellipse cx="176" cy={cy(176) - 1} rx="5.2" ry="3.2" transform={`rotate(-18 176 ${cy(176) - 1})`} fill={g('gold')} />
                <ellipse cx="238" cy={cy(238) - 1} rx="5.2" ry="3.2" transform={`rotate(-18 238 ${cy(238) - 1})`} fill={g('gold')} />
                <path d={strip(KASHIRA[0], KASHIRA[1], -13.5, 13.5)} fill={g('gold')} />
                <ellipse cx={KASHIRA[0] + 1} cy={cy(KASHIRA[0])} rx="3.6" ry="13.5" fill={GOLD} />
              </g>
            </g>
          </g>

          {/* saya: drawn after the blade so it covers the part still inside. Lacquer, rim light, gold koiguchi and kojiri, kurikata and sageo. */}
          <path d={SAYA_PATH} fill={g('lacquer')} />
          <path d={line(SAYA[0] + 18, SAYA[1] - 24, (x) => -SAYA_TAPER(x) + 2.5, 14)} stroke={GOLD} strokeOpacity=".32" strokeWidth=".9" fill="none" />
          <path d={line(SAYA[0] + 18, SAYA[1] - 24, (x) => -SAYA_TAPER(x) + 8, 14)} stroke="#fff" strokeOpacity=".07" strokeWidth="2.4" fill="none" />
          <path d={line(SAYA[0] + 18, SAYA[1] - 24, (x) => SAYA_TAPER(x) - 2, 14)} stroke="#000" strokeOpacity=".55" strokeWidth="2" fill="none" />
          <path d={strip(SAYA[0], SAYA[0] + 18, -22.6, 22.6)} fill={g('gold')} />
          <path d={strip(SAYA[1] - 24, SAYA[1] + 2, -18.5, 18.5)} fill={g('gold')} />
          <path d={strip(418, 442, 14, 25)} fill="#0f0d0b" stroke={GOLD} strokeOpacity=".5" strokeWidth=".6" />
          <path d={`M430 ${cy(430) + 24} C420 ${cy(430) + 58} 388 ${cy(430) + 60} 362 ${cy(430) + 44} S345 ${cy(430) + 40} 342 ${cy(430) + 56}`} stroke="#b3261e" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d={`M430 ${cy(430) + 24} C440 ${cy(430) + 52} 470 ${cy(430) + 56} 492 ${cy(430) + 46}`} stroke="#8b1a12" strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {/* the seven virtues, inlaid in gold along the saya and revealed one after another (outlined glyphs, no font dependency) */}
          <g fill={GOLD}>
            {MARKS.map((m, i) => (
              <g key={VIRTUES[i].jp} className="k-mark" style={{ ['--i' as string]: i }}>
                {m.chars.map((ch, k) => {
                  const s = m.size / 1000; const x = m.x + k * m.size; const cxm = x + m.size / 2;
                  return <path key={ch + k} d={VIRTUE_GLYPHS[ch]} transform={`translate(${x.toFixed(1)} ${(cy(cxm) - 500 * s).toFixed(1)}) scale(${s})`} />;
                })}
              </g>
            ))}
          </g>
        </svg>
      </button>

      {/* Text equivalent: always visible, never hover-only, available with or without the drawing and its effects. */}
      <ul id={listId} aria-label="The seven virtues of Bushidō, engraved on the saya" className="katana-virtues mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[.72rem] uppercase tracking-[.16em] text-silver">
        {VIRTUES.map((v) => <li key={v.jp}><span className="text-gold">{v.jp}</span> {v.name}</li>)}
      </ul>
      <p className="text-center text-xs text-silver/80">Hover, focus or tap the sword to draw it.</p>
    </div>
  );
}
