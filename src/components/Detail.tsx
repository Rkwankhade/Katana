'use client';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CalendarPlus, Check } from 'lucide-react';
import { propertyById } from '@/data/properties';
import { destinationById } from '@/data/destinations';
import { fmtArea, fmtMoney } from '@/lib/filters';
import type { ItemRef } from '@/types';
import { useApp } from './AppState';
import Dialog from './Dialog';
import HotspotImage from './Hotspots';
import { CompareButton, SaveButton } from './SaveCompare';

function CollectionPicker({ r }: { r: ItemRef }) {
  const { collections, savedIn, toggleInCollection } = useApp(); const inIds = savedIn(r);
  return (
    <fieldset className="mt-5"><legend className="text-xs uppercase tracking-[.18em] text-silver">Save to collections</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {collections.map((c) => { const on = inIds.includes(c.id); return (
          <button key={c.id} aria-pressed={on} onClick={() => toggleInCollection(c.id, r)} className={`btn btn-ghost btn-sm ${on ? '!border-gold !text-gold' : ''}`}>{on && <Check size={14} aria-hidden />}{c.name}</button>); })}
      </div>
    </fieldset>
  );
}

function Row({ k, v }: { k: string; v: string }) { return <div className="border-b border-white/10 py-2.5"><dt className="text-xs text-silver">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>; }

function PlanButton({ title, r, cost }: { title: string; r: ItemRef; cost: number }) {
  const { addToPlan, notify } = useApp();
  return <button className="btn btn-primary" onClick={() => { addToPlan(title, r, cost); notify('Added to your plan. Open the Planner to organise it.'); }}><CalendarPlus size={16} aria-hidden /> Add to plan</button>;
}

function Body() {
  const { detail, openDetail } = useApp();
  const [idx, setIdx] = useState(0);
  if (!detail) return null;
  if (detail.kind === 'property') {
    const p = propertyById(detail.id); if (!p) return null; const img = p.gallery[idx] ?? p.image;
    const hs = img === p.image ? p.hotspots : [];
    return (
      <Dialog title={p.name} onClose={() => openDetail(null)} side>
        <HotspotImage src={img} alt={`Illustration of ${p.name}`} hotspots={hs} />
        {p.gallery.length > 1 && (
          <div className="flex gap-2 p-3" role="group" aria-label="Gallery">
            {p.gallery.map((g, i) => (<button key={g + i} onClick={() => setIdx(i)} aria-label={`Image ${i + 1} of ${p.gallery.length}`} aria-pressed={idx === i} className={`h-14 w-20 overflow-hidden border ${idx === i ? 'border-gold' : 'border-white/20 opacity-70'}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={g} alt="" className="h-full w-full object-cover" loading="lazy" /></button>))}
          </div>
        )}
        <div className="p-6">
          <p className="eyebrow">{p.category}</p>
          <h3 className="h-display mt-2 text-4xl">{p.name}</h3>
          <p className="mt-1 text-sm text-silver">{p.location}</p>
          <p className="mt-4 text-ivory/85">{p.description}</p>
          <p className="mt-4 border-l-2 border-gold/60 pl-3 text-xs text-silver">Illustrative demonstration listing. {p.notes} It is not for sale and has no verified address, valuation or availability.</p>
          <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
            <Row k="Architectural style" v={p.architecturalStyle} /><Row k="Illustrative estimate" v={fmtMoney(p.priceEstimate, p.currency)} />
            <Row k="Interior area" v={fmtArea(p.area)} /><Row k="Outdoor area" v={fmtArea(p.outdoorArea)} />
            <Row k="Rooms" v={p.rooms ?? 'Not provided'} /><Row k="Region" v={p.region} />
          </dl>
          <h4 className="mt-6 text-xs uppercase tracking-[.18em] text-silver">Amenities</h4>
          <ul className="mt-2 flex flex-wrap gap-2">{p.amenities.map((a) => <li key={a} className="chip">{a}</li>)}</ul>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tags">{p.tags.map((a) => <li key={a} className="chip !text-gold">{a}</li>)}</ul>
          <CollectionPicker r={{ kind: 'property', id: p.id }} />
          <div className="mt-6 flex flex-wrap gap-2"><SaveButton r={{ kind: 'property', id: p.id }} label small={false} /><CompareButton kind="property" id={p.id} label /><PlanButton title={p.name} r={{ kind: 'property', id: p.id }} cost={0} /></div>
        </div>
      </Dialog>
    );
  }
  const d = destinationById(detail.id); if (!d) return null;
  return (
    <Dialog title={d.name} onClose={() => openDetail(null)} side>
      <div className="aspect-[3/2] w-full bg-slate">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.image} alt={`Illustration of ${d.name}`} className="h-full w-full object-cover" /></div>
      <div className="p-6">
        <p className="eyebrow">{d.category}</p>
        <h3 className="h-display mt-2 text-4xl">{d.name}</h3>
        <p className="mt-1 text-sm text-silver">{d.region}</p>
        <p className="mt-4 text-ivory/85">{d.description}</p>
        <p className="mt-4 border-l-2 border-gold/60 pl-3 text-xs text-silver">Illustrative content. Weather, travel times, availability and prices are not shown because they are not live data.</p>
        <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
          <Row k="Estimated duration" v={d.estimatedDuration ?? 'Not provided'} /><Row k="Illustrative budget" v={fmtMoney(d.illustrativeBudget, d.currency)} />
          <Row k="Experience type" v={d.experienceType} /><Row k="Planning notes" v={d.notes} />
        </dl>
        <h4 className="mt-6 text-xs uppercase tracking-[.18em] text-silver">Best for</h4>
        <ul className="mt-2 flex flex-wrap gap-2">{d.tags.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
        <CollectionPicker r={{ kind: 'destination', id: d.id }} />
        <div className="mt-6 flex flex-wrap gap-2"><SaveButton r={{ kind: 'destination', id: d.id }} label small={false} /><CompareButton kind="destination" id={d.id} label /><PlanButton title={d.name} r={{ kind: 'destination', id: d.id }} cost={d.illustrativeBudget ?? 0} /></div>
      </div>
    </Dialog>
  );
}

export default function DetailHost() {
  const { detail } = useApp();
  return <AnimatePresence>{detail && <Body key={detail.kind + detail.id} />}</AnimatePresence>;
}
