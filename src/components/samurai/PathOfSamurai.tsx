'use client';
import { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotionOK, useTier } from '@/lib/preferences';
import SeasonBackdrop from './SeasonBackdrop';
import SeasonBranch from './SeasonBranch';

/** Layered parallax scene: moon, Fuji, ridges, torii and a lone swordsman. Layers drift at different speeds as the section scrolls past. */
export default function PathOfSamurai() {
  const root = useRef<HTMLElement>(null);
  const motionOK = useMotionOK(); const tier = useTier();
  const parallax = motionOK && tier > 0; // tier 0: static artwork
  useEffect(() => {
    const el = root.current; if (!el || !parallax) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((layer) => {
        const sp = parseFloat(layer.dataset.speed || '0');
        gsap.fromTo(layer, { yPercent: -sp * 18 }, { yPercent: sp * 18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });
      if (tier === 2) { // tier 1 keeps the depth parallax and drops the secondary mist and blossom motion
        gsap.fromTo('[data-drift]', { xPercent: -3 }, { xPercent: 3, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        gsap.fromTo('[data-bloom]', { rotate: -3, transformOrigin: '100% 0%' }, { rotate: 4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
    }, el);
    return () => ctx.revert();
  }, [parallax, tier]);

  const go = () => document.getElementById('destinations')?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });
  return (
    <section ref={root} id="path" aria-labelledby="path-h" className="path-sky relative isolate h-[118vh] min-h-[720px] overflow-hidden scroll-mt-0">
      {/* season sky: four crossfaded layers behind everything (palette in globals.css) */}
      <SeasonBackdrop kind="sky" className="absolute inset-0" />
      {/* stars */}
      <div className="path-stars absolute inset-0 opacity-70" aria-hidden />
      {/* layers, back to front. Each wrapper centres an oversized image so it crops evenly on any aspect ratio. */}
      <div data-speed="0.15" className="absolute right-[10%] top-[10%] w-[min(34vw,340px)]" aria-hidden>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/img/samurai/moon.svg" alt="" width={600} height={600} loading="lazy" decoding="async" className="path-moon w-full" /></div>
      <div data-speed="0.3" className="absolute inset-x-0 bottom-[22%] flex justify-center" aria-hidden>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/img/samurai/fuji.svg" alt="" width={1600} height={520} loading="lazy" decoding="async" className="w-[max(100%,1100px)] max-w-none shrink-0" /></div>
      <div data-speed="0.5" className="absolute inset-x-0 bottom-[8%] flex justify-center" aria-hidden>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/img/samurai/hills.svg" alt="" width={1600} height={420} loading="lazy" decoding="async" className="w-[max(100%,1100px)] max-w-none shrink-0" /></div>
      <div data-speed="0.4" className="absolute inset-x-0 bottom-[16%] h-[26%] overflow-hidden" aria-hidden><div data-drift className="h-full w-[120%] -ml-[10%]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/img/samurai/mist.svg" alt="" width={1600} height={260} loading="lazy" decoding="async" className="h-full w-full" /></div></div>
      {/* foreground: cliff, torii, swordsman */}
      <div data-speed="0.8" className="absolute bottom-0 right-0 w-[min(100%,980px)]" aria-hidden>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samurai/cliff.svg" alt="" width={900} height={360} loading="lazy" decoding="async" className="w-full" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samurai/torii.svg" alt="" width={300} height={270} loading="lazy" decoding="async" className="absolute bottom-[58%] left-[8%] w-[27%]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/samurai/samurai.svg" alt="" width={230} height={420} loading="lazy" decoding="async" className="path-figure absolute bottom-[66%] left-[58%] h-[86%]" />
        </div>
      </div>
      <div data-speed="1.1" className="absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-[#05080d] via-[#05080d]/80 to-transparent" aria-hidden />
      {/* sakura branch */}
      <div data-bloom className="pointer-events-none absolute -right-6 top-0 grid w-[min(62vw,720px)]" aria-hidden><SeasonBranch side="right" /></div>
      <div data-bloom className="pointer-events-none absolute -left-16 -top-6 hidden w-[min(30vw,380px)] opacity-90 md:grid" aria-hidden><SeasonBranch side="left" /></div>

      <p className="path-kanji pointer-events-none absolute right-4 top-1/3 hidden select-none md:block" aria-hidden>武士道</p>

      <div className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-start px-4 pt-[27vh] md:pt-[24vh] md:px-8">
        <p className="eyebrow">The way of the warrior</p>
        <h2 id="path-h" className="h-display mt-3 max-w-3xl text-[clamp(2.2rem,6vw,5rem)] uppercase text-ivory">Walk the old roads.</h2>
        <p className="mt-5 max-w-xl text-base text-ivory/85 md:text-lg">Castle towns, cedar highways and mountain temples where the samurai once travelled. Slow places with a discipline of their own, now gathered into four journeys.</p>
        <div className="mt-8"><button className="btn btn-primary" onClick={go}>Follow the path <ArrowDown size={16} aria-hidden /></button></div>
      </div>
    </section>
  );
}
