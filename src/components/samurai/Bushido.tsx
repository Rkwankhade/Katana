'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotionOK, useTier } from '@/lib/preferences';
import SeasonBackdrop from './SeasonBackdrop';
import { observeVisibility } from '@/lib/visibility';
import { VIRTUES } from '@/data/virtues';

const virtues = VIRTUES;

/** Seven virtues as hanging scrolls. Desktop: the section pins and the scrolls travel sideways with the page scroll. Touch / reduced motion: a native swipe row. */
export default function Bushido() {
  const pinEl = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(1);
  const motionOK = useMotionOK(); const tier = useTier();
  const pinned = motionOK && tier > 0; // otherwise the scrolls are a native swipe row on every screen size

  // Hanko stamp: each scroll is stamped once, the first time at least 55% of it is on screen. The CSS only hides unstamped seals while motion is welcome.
  useEffect(() => {
    const cards = track.current?.querySelectorAll<HTMLElement>('.kake'); if (!cards) return;
    const offs = Array.from(cards).map((el) => observeVisibility(el, (v) => { if (v) el.classList.add('stamped'); }, { min: 0.55, fallback: true }));
    return () => offs.forEach((o) => o());
  }, []);

  useEffect(() => {
    const pin = pinEl.current; const tr = track.current; if (!pin || !tr || !pinned) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth + window.innerWidth * 0.1);
      const tween = gsap.to(tr, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => `+=${dist() + window.innerHeight * 0.4}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => { if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`; setN(Math.min(virtues.length, Math.floor(self.progress * virtues.length * 0.999) + 1)); },
        },
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(tr, { clearProps: 'transform' }); };
    });
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => { window.removeEventListener('load', refresh); mm.revert(); };
  }, [pinned]);

  return (
    <section ref={pinEl} id="bushido" aria-labelledby="bushido-h" className="bushido relative overflow-hidden bg-midnight py-14 md:flex md:min-h-screen md:flex-col md:justify-center md:py-10 scroll-mt-16">
      <SeasonBackdrop kind="glow" className="absolute inset-0" />
      <div className="wrap relative px-4 md:px-8">
        <p className="eyebrow">The seven virtues</p>
        <h2 id="bushido-h" className="h-display mt-3 text-[clamp(1.9rem,4.4vw,3.4rem)] uppercase">Bushidō, the way we choose.</h2>
        <p className="mt-3 max-w-2xl text-sm text-silver md:text-base">An old code of conduct, read here as a quiet guide to choosing spaces and places. Scroll to unroll each one.</p>
      </div>
      <div className="relative mt-8 md:mt-10">
        <div ref={track} className={`bushido-track flex gap-6 overflow-x-auto px-4 pb-6 pt-3 snap-x snap-mandatory md:gap-10 md:px-[8vw] ${pinned ? 'md:overflow-visible md:snap-none' : ''}`} tabIndex={0} aria-label="Seven virtues of Bushido">
          {virtues.map((v, i) => (
            <article key={v.jp} className="kake snap-center" style={{ ['--d' as string]: `${(i % 4) * -1.3}s` }}>
              <div className="kake-roller kake-top" aria-hidden />
              <div className="kake-paper">
                <span className="kake-num" aria-hidden>{v.seal}</span>
                <p className={`kake-kanji ${v.kanji.length > 1 ? 'kake-kanji-2' : ''}`} lang="ja" aria-hidden>{v.kanji}</p>
                <h3 className="kake-title">{v.name}</h3>
                <p className="kake-sub">{v.jp}</p>
                <p className="kake-text">{v.text}</p>
                <span className="hanko" aria-hidden>印</span>
              </div>
              <div className="kake-roller kake-bottom" aria-hidden />
              <span className="kake-tassel kake-tassel-l" aria-hidden /><span className="kake-tassel kake-tassel-r" aria-hidden />
            </article>
          ))}
        </div>
      </div>
      <div className={`wrap mt-6 hidden items-center gap-4 px-8 ${pinned ? 'md:flex' : ''}`} aria-hidden>
        <span className="font-display text-sm tabular-nums text-gold">0{n} <span className="text-silver">/ 0{virtues.length}</span></span>
        <div className="h-px flex-1 bg-white/15"><div ref={fill} className="h-full origin-left bg-gold" style={{ transform: 'scaleX(0)' }} /></div>
      </div>
    </section>
  );
}
