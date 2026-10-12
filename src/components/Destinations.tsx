'use client';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { destinations } from '@/data/destinations';
import { fmtMoney } from '@/lib/filters';
import { useApp } from './AppState';
import { CompareButton, SaveButton } from './SaveCompare';
import Reveal from './samurai/Reveal';

const cats = ['All', 'Nature escapes', 'Architecture and culture', 'Scenic road trips', 'Coastal experiences', 'Mountain destinations', 'Weekend retreats', 'Samurai heritage'];
export default function Destinations() {
  const { openDetail } = useApp();
  const [cat, setCat] = useState('All');
  const list = useMemo(() => destinations.filter((d) => cat === 'All' || d.category === cat), [cat]);
  return (
    <section id="destinations" className="section bg-midnight scroll-mt-16" aria-labelledby="dest-h">
      <div className="wrap">
        <p className="eyebrow">Destinations and experiences</p>
        <h2 id="dest-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase">Go beyond the ordinary.</h2>
        <p className="mt-4 max-w-2xl text-silver">Places chosen for how they feel, with planning controls built in. Budgets are illustrative and nothing shown is live.</p>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Destination category">
          {cats.map((c) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)} className={`btn btn-ghost btn-sm ${cat === c ? '!border-gold !text-gold' : ''}`}>{c}</button>)}
        </div>
        <p role="status" aria-live="polite" className="mt-4 text-sm text-silver">{list.length} destination{list.length === 1 ? '' : 's'}</p>
        {list.length === 0 ? <div className="glass mt-6 p-8 text-center text-silver">No destinations in this category yet.</div> : (
          <Reveal stagger className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((d, i) => (
              <article key={d.id} className={`card-hover glass-solid group overflow-hidden ${i % 5 === 0 && list.length > 3 ? 'lg:col-span-2' : ''}`}>
                <button onClick={() => openDetail({ kind: 'destination', id: d.id })} className="block w-full text-left" aria-label={`View details for ${d.name}`}>
                  <div className={`overflow-hidden ${i % 5 === 0 && list.length > 3 ? 'aspect-[16/8]' : 'aspect-[3/2]'}`}>{/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt={`Illustration of ${d.name}`} loading="lazy" decoding="async" width={1200} height={800} className="zoom h-full w-full object-cover" /></div>
                </button>
                <div className="p-5">
                  <p className="eyebrow">{d.category}</p>
                  <h3 className="h-display mt-2 text-2xl">{d.name}</h3>
                  <p className="mt-1 text-xs text-silver">{d.region} · {d.estimatedDuration ?? 'Duration not provided'} · {fmtMoney(d.illustrativeBudget)}</p>
                  <p className="mt-3 text-sm text-ivory/80">{d.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">{d.tags.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className="btn btn-primary btn-sm" onClick={() => openDetail({ kind: 'destination', id: d.id })}>View details <ArrowRight size={14} className="arrow" aria-hidden /></button>
                    <SaveButton r={{ kind: 'destination', id: d.id }} /><CompareButton kind="destination" id={d.id} />
                  </div>
                </div>
              </article>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}
