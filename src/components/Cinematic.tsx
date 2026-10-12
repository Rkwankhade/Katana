'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from '@/data/chapters';
import { heroMedia, pickHeroSource } from '@/data/media';
import { useMotionOK, useTier } from '@/lib/preferences';
import { director } from '@/lib/director';

const Heading = ({ as: T, ...rest }: { as: 'h1' | 'h2'; className?: string; children: React.ReactNode }) => <T {...rest} />;
const SCROLL_VH = 600; // total section height in vh; scroll range = SCROLL_VH - 100
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Visibility (0..1) of chapter text at progress p. First chapter is fully visible at 0, last stays visible at 1. */
function chapterAlpha(i: number, p: number) {
  const c = chapters[i]; const span = c.end - c.start; const fade = Math.min(0.025, span * 0.25);
  const inA = i === 0 ? 1 : smooth(clamp((p - c.start) / fade));
  const outA = i === chapters.length - 1 ? 1 : 1 - smooth(clamp((p - (c.end - fade)) / fade));
  return Math.min(inA, outA);
}

export default function Cinematic({ onChapter }: { onChapter?: (i: number) => void }) {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const navLine = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const activeRef = useRef(0);
  const motionOK = useMotionOK(); const tier = useTier();
  const source = pickHeroSource(tier); // null on tier 0: poster only
  // Static presentation when scrubbing is unwanted or impossible (reduced motion, Calm, tier 0, or footage that failed / cannot seek): one screen plus the chapter grid.
  const still = !motionOK || !source || videoFailed;
  const videoSrc = source?.src ?? heroMedia.original.src;
  const videoDuration = source?.duration ?? heroMedia.original.duration;

  useEffect(() => {
    const v = video.current; if (!v) return;
    if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setVideoFailed(true);
  }, [still]);

  useEffect(() => {
    if (still) return;
    gsap.registerPlugin(ScrollTrigger);
    const v = video.current; const sec = section.current; if (!v || !sec) return;
    let duration = videoDuration; let target = 0; let current = 0; let stopTick: (() => void) | null = null; let lastSet = -1; let progress = 0; let alive = true; let inView = true;
    const onMeta = () => { if (Number.isFinite(v.duration) && v.duration > 0) duration = v.duration; ScrollTrigger.refresh(); };
    const onSeeking = () => setBuffering(true); const onSeeked = () => setBuffering(false);
    // A server without HTTP Range support yields an unseekable video; scrubbing is impossible then, so use the poster fallback.
    const onCanPlay = () => { if (v.seekable.length === 0) setVideoFailed(true); };
    v.addEventListener('canplay', onCanPlay);
    v.preload = 'auto'; // markup says "metadata" so data-saver and static visitors never download the whole file; scrubbing needs it all
    v.pause(); v.addEventListener('loadedmetadata', onMeta); v.addEventListener('seeking', onSeeking); v.addEventListener('seeked', onSeeked);
    if (v.readyState >= 1) onMeta();

    const apply = (p: number) => {
      progress = p;
      chapters.forEach((_, i) => {
        const el = layers.current[i]; if (!el) return;
        const a = chapterAlpha(i, p); el.style.opacity = String(a);
        el.style.transform = `translate3d(0, ${(1 - a) * 18}px, 0)`;
        el.style.visibility = a < 0.01 ? 'hidden' : 'visible'; el.style.pointerEvents = a > 0.6 ? 'auto' : 'none';
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (navLine.current) navLine.current.style.transform = `scaleY(${p})`;
      // warm light transition on a separate overlay, centred on the start of the Inferno chapter
      if (flash.current) { const c = chapters[2]; const d = Math.abs(p - c.start - 0.03); flash.current.style.opacity = String(0.35 * clamp(1 - d / 0.07)); }
      // chapter with hysteresis so boundaries never flicker
      const cur = chapters[activeRef.current]; const h = 0.004;
      if (p < cur.start - h || p >= cur.end + h) { const next = chapters.findIndex((c) => p >= c.start && p < c.end); const ni = next === -1 ? chapters.length - 1 : next; if (ni !== activeRef.current) { activeRef.current = ni; setActive(ni); onChapter?.(ni); } }
    };

    // Seek easing runs on the shared GSAP ticker (see lib/director.ts) instead of a private requestAnimationFrame loop.
    const stopLoop = () => { stopTick?.(); stopTick = null; };
    const startLoop = () => { if (!stopTick) stopTick = director.frame(tick); };
    const tick = () => {
      if (!alive) return;
      if (!inView) { stopLoop(); return; } // idle while the intro is scrolled past
      const t = clamp(target, 0, Math.max(0, duration - 0.04));
      current += (t - current) * 0.2; if (Math.abs(t - current) < 0.002) current = t;
      // avoid redundant seeks; wait for the previous seek to finish
      if (!v.seeking && Math.abs(current - lastSet) > 1 / 48) { try { v.currentTime = current; lastSet = current; } catch {} }
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: (self) => { target = self.progress * duration; apply(self.progress); },
        onToggle: (self) => { setNavVisible(self.isActive); inView = self.isActive; if (inView) startLoop(); },
        onRefresh: (self) => { target = self.progress * duration; apply(self.progress); },
      });
    }, sec);
    apply(0); startLoop();
    return () => { alive = false; stopLoop(); ctx.revert(); v.removeEventListener('canplay', onCanPlay); v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('seeking', onSeeking); v.removeEventListener('seeked', onSeeked); void progress; };
  }, [still, videoDuration, onChapter]);

  const goTo = (i: number) => {
    const sec = section.current; if (!sec) return;
    if (still) { document.getElementById(`story-${chapters[i].id}`)?.scrollIntoView({ block: 'start' }); return; }
    const range = sec.offsetHeight - window.innerHeight; const p = i === 0 ? 0 : chapters[i].start + 0.012;
    window.scrollTo({ top: sec.offsetTop + range * p, behavior: 'smooth' });
  };
  const goExplore = () => document.getElementById('explore')?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });
  const goAbout = () => document.getElementById('about')?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });

  return (
    <>
      <section ref={section} id="cinema" aria-label="AETHER cinematic introduction" style={{ height: still ? '100vh' : `var(--cinema-h, ${SCROLL_VH}vh)` }} className="relative bg-midnight">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05080d]">
          {/* Original footage. No filters, scale or blend modes are ever applied to this element. */}
          {!still ? (
            <video ref={video} className="hero-video" src={videoSrc} poster={heroMedia.poster} muted playsInline preload="metadata" aria-hidden="true"
              onError={() => setVideoFailed(true)} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-video" src={heroMedia.poster} alt="Moonlit coastal mansion, the opening frame of the AETHER film" />
          )}
          {/* Independent overlay layers */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05080d]/55 via-[#05080d]/10 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05080d]/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#05080d]/70 to-transparent" />
          <div ref={flash} className="pointer-events-none absolute inset-0 opacity-0" style={{ background: 'radial-gradient(60% 60% at 70% 55%, rgba(232,146,58,.55), transparent 70%)' }} />

          {/* Chapter text layers */}
          <div className="absolute inset-0">
            {chapters.map((c, i) => (
              <div key={c.id} ref={(el) => { layers.current[i] = el; }} className="absolute inset-0 flex items-end pb-28 md:items-center md:pb-0"
                style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }} aria-hidden={active !== i}>
                <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
                  <div className="max-w-[56rem]">
                    <p className={`eyebrow mb-4 ${i === 0 ? 'a-fade' : ''}`} style={i === 0 ? { animationDelay: '.2s' } : undefined}>
                      <span className="tabular-nums">0{c.index}</span> <span className="mx-2 text-silver">/</span> {c.name}
                    </p>
                    <Heading className={`h-display uppercase text-[clamp(2rem,5.2vw,4.9rem)] ${c.warm ? 'text-[#f6e3c4]' : 'text-ivory'}`} as={i === 0 ? 'h1' : 'h2'}>
                      {i === 0 ? (
                        <>
                          <span className="mask-line"><span style={{ animationDelay: '.35s' }}>Find your</span></span>
                          <span className="mask-line"><span style={{ animationDelay: '.5s' }}>next perspective.</span></span>
                        </>
                      ) : c.headline}
                    </Heading>
                    <p className={`mt-5 max-w-xl text-base md:text-lg text-ivory/85 ${i === 0 ? 'a-fade-up' : ''}`} style={i === 0 ? { animationDelay: '.8s' } : undefined}>{c.text}</p>
                    {c.pillars && (
                      <ul className="mt-7 grid max-w-2xl grid-cols-3 gap-px border border-white/15 bg-white/10 text-sm">
                        {c.pillars.map((p) => (
                          <li key={p.title} className="glass px-3 py-3 md:px-4"><span className="block text-gold text-[.8rem] md:text-sm tracking-wide">{p.title}</span><span className="hidden md:block text-xs text-silver mt-1">{p.text}</span></li>
                        ))}
                      </ul>
                    )}
                    {c.cta && (
                      <div className={`mt-8 flex flex-wrap gap-3 ${i === 0 ? 'a-fade-up' : ''}`} style={i === 0 ? { animationDelay: '1s' } : undefined}>
                        <button className="btn btn-primary" onClick={goExplore} tabIndex={active === i ? 0 : -1}>{c.cta.label} <ArrowDown size={16} aria-hidden /></button>
                        {i === 0 && <button className="btn btn-ghost" onClick={goAbout} tabIndex={active === i ? 0 : -1}>Discover AETHER</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll cue */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block" style={{ opacity: active === 0 ? 1 : 0, transition: 'opacity .4s' }}>
          <div className="a-fade flex flex-col items-center gap-2" style={{ animationDelay: '1.3s' }}>
            <span className="text-[.65rem] uppercase tracking-[.3em] text-silver">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-white/20"><span className="absolute inset-0 bg-gold" style={{ animation: 'scrollcue 1.8s ease-in-out infinite' }} /></span>
          </div></div>

          {buffering && <div className="absolute left-4 top-20 text-[.65rem] uppercase tracking-[.25em] text-silver" role="status">Syncing frame</div>}
          {videoFailed && <div className="absolute right-4 top-20 glass px-3 py-2 text-xs text-silver" role="status">The footage could not load. Showing the opening frame.</div>}

          {/* Thin top progress */}
          <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10"><div ref={bar} className="h-full origin-left bg-gold" style={{ transform: 'scaleX(0)' }} /></div>

          {/* Desktop chapter navigator */}
          {!still && (
            <nav aria-label="Chapters" className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block" style={{ opacity: navVisible ? 1 : 0, visibility: navVisible ? 'visible' : 'hidden', pointerEvents: navVisible ? 'auto' : 'none', transition: 'opacity .35s, visibility .35s' }}>
              <div className="a-fade relative" style={{ animationDelay: '1.5s' }}>
                <div className="absolute bottom-3 right-[11px] top-3 w-px bg-white/20" aria-hidden><div ref={navLine} className="h-full origin-top bg-gold" style={{ transform: 'scaleY(0)' }} /></div>
                <ol className="relative flex flex-col gap-7">
                  {chapters.map((c, i) => (
                    <li key={c.id} className="flex items-center justify-end gap-3">
                      <span className={`text-right text-xs uppercase tracking-[.2em] transition-all duration-300 ${active === i ? 'translate-x-0 text-gold opacity-100' : 'translate-x-1 text-silver opacity-0 hover:opacity-100 focus-within:opacity-100'}`}>
                        <span className="tabular-nums mr-2">0{c.index}</span>{c.label}
                      </span>
                      <button onClick={() => goTo(i)} aria-label={`Chapter ${c.index}: ${c.name}`} aria-current={active === i ? 'step' : undefined}
                        onFocus={(e) => e.currentTarget.parentElement?.querySelector('span')?.classList.add('!opacity-100')} onBlur={(e) => e.currentTarget.parentElement?.querySelector('span')?.classList.remove('!opacity-100')}
                        className="grid h-6 w-6 place-items-center" >
                        <span className={`block rotate-45 border transition-all duration-300 ${active === i ? 'h-4 w-4 border-gold bg-gold shadow-[0_0_0_4px_rgba(216,189,138,.25)]' : 'h-2.5 w-2.5 border-ivory/70 bg-midnight hover:border-gold'}`} />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          )}

          {/* Mobile chapter selector */}
          {!still && (
            <nav aria-label="Chapters" className="absolute inset-x-4 bottom-4 z-40 md:hidden" style={{ opacity: navVisible ? 1 : 0, transition: 'opacity .3s' }}>
              <div className="glass flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="px-2 text-[.65rem] uppercase tracking-[.2em] text-gold">{chapters[active].label}</span>
                <ol className="flex gap-1">
                  {chapters.map((c, i) => (
                    <li key={c.id}><button onClick={() => goTo(i)} aria-label={`Chapter ${c.index}: ${c.name}`} aria-current={active === i ? 'step' : undefined}
                      className={`h-9 w-9 text-xs tabular-nums border transition-colors ${active === i ? 'border-gold bg-gold text-charcoal font-semibold' : 'border-white/25 text-ivory'}`}>{c.index}</button></li>
                  ))}
                </ol>
              </div>
            </nav>
          )}
        </div>
      </section>

      {still && (
        <section aria-label="The AETHER story" className="section bg-midnight">
          <div className="wrap grid gap-px bg-white/10 md:grid-cols-5">
            {chapters.map((c) => (
              <article key={c.id} id={`story-${c.id}`} className="bg-midnight p-5">
                <p className="eyebrow">0{c.index} {c.label}</p>
                <h2 className="h-display mt-3 text-xl uppercase">{c.headline}</h2>
                <p className="mt-3 text-sm text-silver">{c.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="sr-only"><ChevronDown aria-hidden /></div>
    </>
  );
}
