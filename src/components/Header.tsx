'use client';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { motionConfig } from '@/lib/motion';
import { onResize, onScroll } from '@/lib/scrollHub';
import SettingsMenu from './SettingsMenu';
import Crest from '@/components/samurai/Crest';
import { useMotionOK, useTier } from '@/lib/preferences';

export const NAV = [
  { href: '#explore', label: 'Explore' }, { href: '#destinations', label: 'Destinations' }, { href: '#bushido', label: 'Bushidō' }, { href: '#collections', label: 'Collections' },
  { href: '#compare', label: 'Compare' }, { href: '#planner', label: 'Planner' }, { href: '#studio', label: 'Design Studio' },
];

export default function Header({ home = true }: { home?: boolean }) {
  const [solid, setSolid] = useState(!home);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const btn = useRef<HTMLButtonElement>(null);
  const crest = useRef<HTMLSpanElement>(null);
  const lastSection = useRef('');
  const motionOK = useMotionOK(); const tier = useTier();
  useEffect(() => {
    if (!home) return;
    const run = () => { const c = document.getElementById('cinema'); setSolid(c ? c.getBoundingClientRect().bottom <= 72 : true); };
    run(); const offScroll = onScroll(run); const offResize = onResize(run);
    return () => { offScroll(); offResize(); };
  }, [home]);
  useEffect(() => {
    if (!home || !('IntersectionObserver' in window)) return;
    const els = NAV.map((n) => document.getElementById(n.href.slice(1))).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setCurrent('#' + e.target.id); }); }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [home]);
  // Crest accent: one glow pulse and quarter turn each time a different section becomes current (never on the first one, never when motion is off).
  useEffect(() => {
    const prev = lastSection.current; lastSection.current = current;
    const el = crest.current; if (!el || !prev || !current || prev === current || !motionOK || tier === 0) return;
    el.classList.remove('crest-pulse'); void el.offsetWidth; el.classList.add('crest-pulse'); // restart the one-shot animation
  }, [current, motionOK, tier]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open]);
  const prefix = home ? '' : '/';
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? 'bg-midnight/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 md:px-8">
        <a href={home ? '#cinema' : '/'} className="flex items-center gap-3 font-display text-xl tracking-[.38em] text-ivory" aria-label="AETHER home"><Crest ref={crest} size={28} />AETHER</a>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => <a key={n.href} href={prefix + n.href} aria-current={current === n.href ? 'location' : undefined} className={`nav-link text-[.78rem] uppercase tracking-[.16em] transition-colors hover:text-gold ${current === n.href ? 'text-gold' : 'text-ivory/80'}`}>{n.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <SettingsMenu open={settingsOpen} onOpenChange={(o) => { setSettingsOpen(o); if (o) setOpen(false); }} />
          <button ref={btn} className="grid h-11 w-11 place-items-center border border-white/25 lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => { setOpen((o) => !o); setSettingsOpen(false); }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div id="mobile-nav" role="dialog" aria-label="Menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: motionConfig.duration.base, ease: motionConfig.ease }}
            className="fixed inset-x-0 top-16 h-[calc(100vh-4rem)] overflow-auto bg-midnight px-4 py-6 lg:hidden">
            <ul className="flex flex-col">
              {NAV.map((n) => <li key={n.href} className="border-b border-white/10"><a href={prefix + n.href} onClick={() => setOpen(false)} className="block py-4 font-display text-2xl text-ivory">{n.label}</a></li>)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
