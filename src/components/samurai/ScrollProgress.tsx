'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { onResize, onScroll } from '@/lib/scrollHub';
import { useMotionOK } from '@/lib/preferences';

/** Gold read-progress line (hidden over the cinematic intro) and a back-to-top control. Driven by the shared scroll hub, no re-renders while scrolling. */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const motionOK = useMotionOK();
  useEffect(() => {
    let last = false;
    const update = () => {
      const doc = document.documentElement; const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const cin = document.getElementById('cinema');
      const past = cin ? cin.getBoundingClientRect().bottom < window.innerHeight * 0.25 : true;
      if (bar.current) { bar.current.style.transform = `scaleX(${p})`; bar.current.style.opacity = past ? '1' : '0'; }
      if (past !== last) { last = past; setShow(past); }
    };
    update(); const offScroll = onScroll(update); const offResize = onResize(update);
    return () => { offScroll(); offResize(); };
  }, []);
  const top = () => window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' });
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]" aria-hidden>
        <div ref={bar} className="season-progress h-full origin-left" style={{ transform: 'scaleX(0)', opacity: 0, transition: 'opacity .3s' }} />
      </div>
      <button onClick={top} aria-label="Back to top" tabIndex={show ? 0 : -1}
        className={`fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center border border-gold/60 bg-midnight/80 text-gold backdrop-blur transition-all duration-300 hover:bg-gold hover:text-charcoal ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
        style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', width: 52, height: 52 }}>
        <ArrowUp size={18} aria-hidden />
      </button>
    </>
  );
}
