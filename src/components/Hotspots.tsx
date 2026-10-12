'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Hotspot } from '@/types';

/** Image with hotspots positioned in percentages so they stay aligned at any size. */
export default function HotspotImage({ src, alt, hotspots }: { src: string; alt: string; hotspots: Hotspot[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpenId(null); }, [src]);
  useEffect(() => {
    if (!openId) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpenId(null); } };
    const d = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpenId(null); };
    document.addEventListener('keydown', k, true); document.addEventListener('mousedown', d);
    return () => { document.removeEventListener('keydown', k, true); document.removeEventListener('mousedown', d); };
  }, [openId]);
  const open = hotspots.find((h) => h.id === openId);
  return (
    <div ref={root} className="relative aspect-[3/2] w-full overflow-hidden bg-slate">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      {hotspots.map((h) => (
        <button key={h.id} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={`${h.label}: show details`} aria-expanded={openId === h.id} aria-controls={`hs-${h.id}`}
          onClick={() => setOpenId(openId === h.id ? null : h.id)}
          className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center border transition-all ${openId === h.id ? 'border-gold bg-gold text-charcoal scale-110' : 'border-ivory bg-midnight/70 text-ivory hover:border-gold'}`}>
          <span className="block h-2 w-2 rotate-45 bg-current" />
        </button>
      ))}
      {open && (
        <div id={`hs-${open.id}`} role="region" aria-label={open.label} className="glass-solid absolute bottom-3 left-3 right-3 p-4 md:right-auto md:max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow">{open.label}</p>
            <button onClick={() => setOpenId(null)} aria-label="Close detail" className="-m-2 grid h-9 w-9 place-items-center text-silver hover:text-ivory"><X size={16} /></button>
          </div>
          <p className="mt-2 text-sm text-ivory/90">{open.detail}</p>
        </div>
      )}
      {hotspots.length > 0 && <p className="pointer-events-none absolute left-3 top-3 bg-midnight/70 px-2 py-1 text-[.65rem] uppercase tracking-[.2em] text-silver">Select a marker</p>}
    </div>
  );
}
