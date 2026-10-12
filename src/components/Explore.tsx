'use client';
import { useMemo, useState } from 'react';
import { ArrowRight, LayoutGrid, List, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { properties } from '@/data/properties';
import { applyFilters, emptyFilters, fmtArea, fmtMoney, type Filters } from '@/lib/filters';
import type { Property } from '@/types';
import { useApp } from './AppState';
import { CompareButton, SaveButton } from './SaveCompare';
import { motionConfig } from '@/lib/motion';

const uniq = (f: (p: Property) => string[]) => Array.from(new Set(properties.flatMap(f))).sort();
const categories = ['Coastal villas', 'Mountain retreats', 'Contemporary residences', 'Boutique hospitality', 'Architectural landmarks', 'Interior design references'];

export function PropertyCard({ p, list = false }: { p: Property; list?: boolean }) {
  const { openDetail } = useApp();
  return (
    <motion.article layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: motionConfig.duration.base, ease: motionConfig.ease }}
      className={`card-hover glass-solid group flex ${list ? 'flex-col md:flex-row' : 'flex-col'} overflow-hidden`}>
      <button onClick={() => openDetail({ kind: 'property', id: p.id })} className={`relative block overflow-hidden text-left ${list ? 'md:w-72 md:shrink-0' : ''}`} aria-label={`View details for ${p.name}`}>
        <div className="aspect-[3/2] overflow-hidden bg-slate">{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={`Illustration of ${p.name}, ${p.architecturalStyle.toLowerCase()} architecture`} loading="lazy" decoding="async" className="zoom h-full w-full object-cover" /></div>
        <span className="absolute left-3 top-3 bg-midnight/80 px-2 py-1 text-[.62rem] uppercase tracking-[.2em] text-gold">Illustrative</span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{p.category}</p>
        <h3 className="h-display mt-2 text-2xl">{p.name}</h3>
        <p className="mt-1 text-xs text-silver">{p.location} · {p.architecturalStyle}</p>
        <p className="mt-3 text-sm text-ivory/80">{p.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-silver">Illustrative estimate</dt><dd className="mt-0.5 text-ivory">{fmtMoney(p.priceEstimate, p.currency)}</dd></div>
          <div><dt className="text-silver">Area</dt><dd className="mt-0.5 text-ivory">{fmtArea(p.area)}</dd></div>
        </dl>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Amenities">{p.amenities.slice(0, 3).map((a) => <li key={a} className="chip">{a}</li>)}</ul>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <button onClick={() => openDetail({ kind: 'property', id: p.id })} className="btn btn-primary btn-sm">View details <ArrowRight size={14} className="arrow" aria-hidden /></button>
          <SaveButton r={{ kind: 'property', id: p.id }} /><CompareButton kind="property" id={p.id} />
        </div>
      </div>
    </motion.article>
  );
}

export default function Explore() {
  const [f, setF] = useState<Filters>(emptyFilters);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const set = (k: keyof Filters, v: string) => setF((o) => ({ ...o, [k]: v }));
  const results = useMemo(() => applyFilters(properties, f), [f]);
  const chips = (Object.keys(f) as (keyof Filters)[]).filter((k) => k !== 'sort' && f[k] !== '').map((k) => ({ k, label: ({ q: 'Search', category: 'Category', region: 'Location', style: 'Style', amenity: 'Amenity', minPrice: 'Min price', maxPrice: 'Max price', minArea: 'Min area', maxArea: 'Max area' } as Record<string, string>)[k] + ': ' + f[k] }));
  const sel = (id: string, label: string, k: keyof Filters, opts: string[]) => (
    <div><label htmlFor={id} className="mb-1 block text-xs text-silver">{label}</label>
      <select id={id} className="field" value={f[k]} onChange={(e) => set(k, e.target.value)}><option value="">All</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
  );
  return (
    <section id="explore" className="section bg-midnight scroll-mt-16" aria-labelledby="explore-h">
      <div className="wrap">
        <p className="eyebrow">Explore</p>
        <h2 id="explore-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase">Explore the extraordinary.</h2>
        <p className="mt-4 max-w-2xl text-silver">Discover spaces and destinations that match the way you want to live, travel, or create.</p>
        <p className="mt-3 max-w-2xl border-l-2 border-gold/60 pl-3 text-xs text-silver">All listings are illustrative demonstration content with original illustrations. Prices and details are placeholders, not real offers, and nothing here is available to book or buy.</p>

        <div className="glass mt-8 p-4 md:p-5">
          <div className="relative">
            <label htmlFor="q" className="sr-only">Search spaces</label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" aria-hidden />
            <input id="q" type="search" className="field !pl-9" placeholder="Search by name, keyword, style or amenity" value={f.q} onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sel('f-cat', 'Category', 'category', categories)}
            {sel('f-reg', 'Location', 'region', uniq((p) => [p.region]))}
            {sel('f-sty', 'Architectural style', 'style', uniq((p) => [p.architecturalStyle]))}
            {sel('f-ame', 'Amenity', 'amenity', uniq((p) => p.amenities))}
            <div><label htmlFor="f-minp" className="mb-1 block text-xs text-silver">Min estimate (USD)</label><input id="f-minp" inputMode="numeric" type="number" min={0} className="field" value={f.minPrice} onChange={(e) => set('minPrice', e.target.value)} placeholder="Any" /></div>
            <div><label htmlFor="f-maxp" className="mb-1 block text-xs text-silver">Max estimate (USD)</label><input id="f-maxp" inputMode="numeric" type="number" min={0} className="field" value={f.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} placeholder="Any" /></div>
            <div><label htmlFor="f-mina" className="mb-1 block text-xs text-silver">Min area (m²)</label><input id="f-mina" inputMode="numeric" type="number" min={0} className="field" value={f.minArea} onChange={(e) => set('minArea', e.target.value)} placeholder="Any" /></div>
            <div><label htmlFor="f-maxa" className="mb-1 block text-xs text-silver">Max area (m²)</label><input id="f-maxa" inputMode="numeric" type="number" min={0} className="field" value={f.maxArea} onChange={(e) => set('maxArea', e.target.value)} placeholder="Any" /></div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" aria-live="polite" className="text-sm text-silver"><span className="text-ivory">{results.length}</span> of {properties.length} results</p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs text-silver">Sort</label>
            <select id="sort" className="field !w-auto" value={f.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="featured">Featured</option><option value="price-asc">Estimate: low to high</option><option value="price-desc">Estimate: high to low</option><option value="area-desc">Largest area</option><option value="name">Name</option>
            </select>
            <div className="flex" role="group" aria-label="View">
              <button className={`grid h-[42px] w-[42px] place-items-center border ${view === 'grid' ? 'border-gold text-gold' : 'border-white/20'}`} aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}><LayoutGrid size={17} /></button>
              <button className={`grid h-[42px] w-[42px] place-items-center border border-l-0 ${view === 'list' ? 'border-gold text-gold' : 'border-white/20'}`} aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}><List size={17} /></button>
            </div>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((c) => <button key={c.k} className="chip hover:border-gold" onClick={() => set(c.k, '')} aria-label={`Remove filter ${c.label}`}>{c.label}<X size={12} aria-hidden /></button>)}
            <button className="text-xs uppercase tracking-[.15em] text-gold underline-offset-4 hover:underline" onClick={() => setF({ ...emptyFilters, sort: f.sort })}>Clear all filters</button>
          </div>
        )}

        {results.length === 0 ? (
          <div className="glass mt-8 p-10 text-center"><p className="h-display text-2xl">No spaces match these filters.</p><p className="mt-2 text-sm text-silver">Try removing a filter or searching a broader term.</p>
            <button className="btn btn-primary mt-5" onClick={() => setF({ ...emptyFilters })}>Clear all filters</button></div>
        ) : (
          <div className={`mt-8 ${view === 'grid' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-5'}`}>
            {results.map((p) => <PropertyCard key={p.id} p={p} list={view === 'list'} />)}
          </div>
        )}
      </div>
    </section>
  );
}
