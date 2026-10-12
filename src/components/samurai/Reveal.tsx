'use client';
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useMotionOK } from '@/lib/preferences';

interface Props { as?: 'div' | 'section' | 'ul' | 'ol' | 'header'; className?: string; stagger?: boolean; style?: CSSProperties; children: ReactNode }

/**
 * Scroll-triggered reveal. Content is fully visible on first paint (SSR / no-JS safe); the hidden state is only
 * "armed" after mount, and only for elements that are still below the fold, so nothing flashes and nothing is lost.
 */
export default function Reveal({ as = 'div', className = '', stagger = false, style, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const motionOK = useMotionOK();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!motionOK || !('IntersectionObserver' in window)) { el.classList.add('in'); return; } // Calm / reduced motion: show everything, nothing is withheld
    if (el.classList.contains('in')) return; // already revealed (effect re-ran after a preference change)
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0) { el.classList.add('in'); return; }
    el.dataset.armed = '1';
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { el.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    io.observe(el);
    return () => io.disconnect();
  }, [motionOK]);
  return createElement(as, { ref, className: `rv ${stagger ? 'rv-stagger' : ''} ${className}`.trim(), style }, children);
}
