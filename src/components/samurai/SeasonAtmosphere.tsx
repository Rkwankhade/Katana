'use client';
import { useEffect, useRef } from 'react';
import { onScroll } from '@/lib/scrollHub';
import SeasonBackdrop from './SeasonBackdrop';

/**
 * A very faint, fixed seasonal veil at the screen edges (alpha <= .07). It stays off over the cinematic intro so the hero footage is
 * never tinted, and fades in once the page moves past it. Visibility rides the shared scroll hub; no state, no extra listener.
 */
export default function SeasonAtmosphere() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const update = () => { const c = document.getElementById('cinema'); el.style.opacity = (c ? c.getBoundingClientRect().bottom < window.innerHeight * 0.4 : true) ? '1' : '0'; };
    update(); const off = onScroll(update);
    return off;
  }, []);
  return <div ref={box} aria-hidden className="pointer-events-none fixed inset-0 z-[24]" style={{ opacity: 0, transition: 'opacity .8s' }}><SeasonBackdrop kind="veil" className="absolute inset-0" /></div>;
}
