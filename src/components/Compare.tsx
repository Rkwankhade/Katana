'use client';
import { X } from 'lucide-react';
import { properties, propertyById } from '@/data/properties';
import { destinations, destinationById } from '@/data/destinations';
import { fmtArea, fmtMoney } from '@/lib/filters';
import { useApp } from './AppState';

type Row = { label: string; values: string[] };
export default function Compare() {
  const { compare, setCompareKind, toggleCompare, clearCompare, openDetail, notify } = useApp();
  const isProp = compare.kind === 'property';
  const items = isProp ? compare.ids.map(propertyById).filter(Boolean) as typeof properties : compare.ids.map(destinationById).filter(Boolean) as typeof destinations;
  const rows: Row[] = isProp
    ? [
        { label: 'Category', values: (items as typeof properties).map((p) => p.category) }, { label: 'Location', values: (items as typeof properties).map((p) => p.location) },
        { label: 'Illustrative estimate', values: (items as typeof properties).map((p) => fmtMoney(p.priceEstimate, p.currency)) }, { label: 'Interior area', values: (items as typeof properties).map((p) => fmtArea(p.area)) },
        { label: 'Architectural style', values: (items as typeof properties).map((p) => p.architecturalStyle) }, { label: 'Amenities', values: (items as typeof properties).map((p) => p.amenities.join(', ') || 'Not provided') },
        { label: 'Outdoor space', values: (items as typeof properties).map((p) => fmtArea(p.outdoorArea)) }, { label: 'Notes', values: (items as typeof properties).map((p) => p.notes || 'Not provided') },
      ]
    : [
        { label: 'Region', values: (items as typeof destinations).map((d) => d.region) }, { label: 'Experience type', values: (items as typeof destinations).map((d) => d.experienceType) },
        { label: 'Estimated duration', values: (items as typeof destinations).map((d) => d.estimatedDuration ?? 'Not provided') }, { label: 'Illustrative budget', values: (items as typeof destinations).map((d) => fmtMoney(d.illustrativeBudget, d.currency)) },
        { label: 'Planning notes', values: (items as typeof destinations).map((d) => d.notes || 'Not provided') },
      ];
  const differs = (r: Row) => new Set(r.values).size > 1;
  const names = (items as { name: string; id: string }[]);
  return (
    <section id="compare" className="section bg-midnight scroll-mt-16" aria-labelledby="cmp-h">
      <div className="wrap">
        <p className="eyebrow">Compare</p>
        <h2 id="cmp-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase">Side by side, nothing hidden.</h2>
        <p className="mt-4 max-w-2xl text-silver">Compare up to three spaces or three destinations. Differences are highlighted, and no score is invented for you.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Comparison type">
          {(['property', 'destination'] as const).map((k) => (
            <button key={k} aria-pressed={compare.kind === k} className={`btn btn-ghost btn-sm ${compare.kind === k ? '!border-gold !text-gold' : ''}`}
              onClick={() => { if (compare.kind !== k) { setCompareKind(k); notify(`Comparing ${k === 'property' ? 'spaces' : 'destinations'}`); } }}>
              {k === 'property' ? 'Spaces' : 'Destinations'}</button>
          ))}
          {items.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { clearCompare(); notify('Comparison cleared'); }}>Clear comparison</button>}
        </div>
        {items.length < 2 ? (
          <div className="glass mt-8 p-10 text-center"><p className="h-display text-2xl">{items.length === 0 ? 'Nothing to compare yet.' : 'Add one more to compare.'}</p>
            <p className="mt-2 text-sm text-silver">Use the compare button on any card. You have {items.length} selected.</p>
            <a href={isProp ? '#explore' : '#destinations'} className="btn btn-primary mt-5">Choose {isProp ? 'spaces' : 'destinations'}</a>
            {items.length === 1 && <ul className="mt-5 flex justify-center gap-2">{names.map((n) => <li key={n.id} className="chip">{n.name}<button aria-label={`Remove ${n.name}`} onClick={() => toggleCompare(compare.kind, n.id)}><X size={12} /></button></li>)}</ul>}
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Comparison of selected {isProp ? 'spaces' : 'destinations'}</caption>
              <thead><tr><td className="w-40" />
                {names.map((n) => (
                  <th key={n.id} scope="col" className="border-b border-white/15 p-3 align-bottom font-normal">
                    <div className="flex items-start justify-between gap-2"><button className="font-display text-xl text-ivory hover:text-gold" onClick={() => openDetail({ kind: compare.kind, id: n.id })}>{n.name}</button>
                      <button aria-label={`Remove ${n.name} from comparison`} className="grid h-8 w-8 place-items-center border border-white/20 hover:border-gold" onClick={() => toggleCompare(compare.kind, n.id)}><X size={14} /></button></div>
                  </th>))}
              </tr></thead>
              <tbody>
                {rows.map((r) => { const d = differs(r); return (
                  <tr key={r.label} className={d ? 'bg-gold/[.07]' : ''}>
                    <th scope="row" className="border-b border-white/10 p-3 align-top text-xs font-normal uppercase tracking-[.14em] text-silver">{r.label}{d && <span className="ml-2 text-gold" title="Values differ">Differs</span>}</th>
                    {r.values.map((v, i) => <td key={i} className={`border-b border-white/10 p-3 align-top ${v === 'Not provided' ? 'text-silver italic' : ''}`}>{v}</td>)}
                  </tr>); })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
