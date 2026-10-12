'use client';
import { ArrowUpRight } from 'lucide-react';
import { propertyById } from '@/data/properties';
import { fmtMoney } from '@/lib/filters';
import { useApp } from './AppState';
import { SaveButton } from './SaveCompare';

const ids = ['p-tidewater', 'p-glassline', 'p-pinehall'];
export default function Featured() {
  const { openDetail } = useApp();
  const items = ids.map(propertyById).filter((p): p is NonNullable<ReturnType<typeof propertyById>> => !!p);
  return (
    <section id="featured" className="section bg-charcoal scroll-mt-16" aria-labelledby="feat-h">
      <div className="wrap">
        <p className="eyebrow">Featured spaces</p>
        <h2 id="feat-h" className="h-display mt-3 text-[clamp(1.8rem,4vw,3.2rem)] uppercase">Three ways to live with a view.</h2>
        <div className="mt-10 grid gap-px bg-white/10 lg:grid-cols-12">
          {items.map((p, i) => (
            <article key={p.id} className={`group relative overflow-hidden bg-charcoal ${i === 0 ? 'lg:col-span-8 lg:row-span-2' : 'lg:col-span-4'}`}>
              <button onClick={() => openDetail({ kind: 'property', id: p.id })} className="block w-full text-left" aria-label={`View ${p.name}`}>
                <div className={`overflow-hidden ${i === 0 ? 'aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[34rem]' : 'aspect-[16/10]'}`}>{/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`Illustration of ${p.name}`} loading="lazy" decoding="async" className="zoom h-full w-full object-cover" /></div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05080d] via-[#05080d]/70 to-transparent p-5 pt-16">
                  <p className="eyebrow">{p.category}</p>
                  <h3 className="h-display mt-1 text-2xl md:text-3xl">{p.name} <ArrowUpRight size={20} className="inline text-gold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden /></h3>
                  <p className="mt-1 text-xs text-silver">{p.architecturalStyle} · Illustrative estimate {fmtMoney(p.priceEstimate)}</p>
                </div>
              </button>
              <div className="absolute right-3 top-3"><SaveButton r={{ kind: 'property', id: p.id }} /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
