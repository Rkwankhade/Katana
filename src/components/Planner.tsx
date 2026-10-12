'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import type { ItineraryItem, Trip } from '@/types';
import { uid } from '@/lib/motion';
import { tripDays, validateTripDates } from '@/lib/validation';
import { fmtMoney } from '@/lib/filters';
import { useApp } from './AppState';
import Dialog, { ConfirmDialog } from './Dialog';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (start: string, day: number) => { const d = new Date(Date.parse(start) + (day - 1) * 86400000); return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }); };

function TripForm({ initial, onSave, onCancel }: { initial?: Trip; onSave: (t: Omit<Trip, 'id' | 'items'>) => void; onCancel?: () => void }) {
  const today = new Date();
  const [name, setName] = useState(initial?.name ?? ''); const [dest, setDest] = useState(initial?.destination ?? '');
  const [start, setStart] = useState(initial?.startDate ?? iso(today)); const [end, setEnd] = useState(initial?.endDate ?? iso(new Date(today.getTime() + 2 * 86400000)));
  const [budget, setBudget] = useState(String(initial?.budget ?? '')); const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {};
    if (!name.trim()) er.name = 'Give the trip a name.';
    const de = validateTripDates(start, end); if (de) er.dates = de;
    const b = budget.trim() === '' ? 0 : Number(budget); if (!Number.isFinite(b) || b < 0) er.budget = 'Budget must be zero or more.';
    setErrs(er); if (Object.keys(er).length) return;
    onSave({ name: name.trim(), destination: dest.trim(), startDate: start, endDate: end, budget: b, notes });
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div><label htmlFor="t-name" className="mb-1 block text-xs text-silver">Trip name</label><input id="t-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-invalid={!!errs.name} data-autofocus />{errs.name && <p role="alert" className="mt-1 text-xs text-[#f0a090]">{errs.name}</p>}</div>
      <div><label htmlFor="t-dest" className="mb-1 block text-xs text-silver">Destination</label><input id="t-dest" className="field" value={dest} onChange={(e) => setDest(e.target.value)} maxLength={80} /></div>
      <div><label htmlFor="t-start" className="mb-1 block text-xs text-silver">Start date</label><input id="t-start" type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} aria-invalid={!!errs.dates} /></div>
      <div><label htmlFor="t-end" className="mb-1 block text-xs text-silver">End date</label><input id="t-end" type="date" className="field" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-invalid={!!errs.dates} /></div>
      {errs.dates && <p role="alert" className="text-xs text-[#f0a090] sm:col-span-2">{errs.dates}</p>}
      <div><label htmlFor="t-budget" className="mb-1 block text-xs text-silver">Planned budget (USD, optional)</label><input id="t-budget" type="number" min={0} inputMode="decimal" className="field" value={budget} onChange={(e) => setBudget(e.target.value)} />{errs.budget && <p role="alert" className="mt-1 text-xs text-[#f0a090]">{errs.budget}</p>}</div>
      <div><label htmlFor="t-notes" className="mb-1 block text-xs text-silver">Notes</label><input id="t-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} /></div>
      <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary" type="submit">{initial ? 'Save trip' : 'Create trip'}</button>{onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}

function ItemForm({ days, initial, onSave, onCancel }: { days: number; initial?: ItineraryItem; onSave: (v: { day: number; title: string; cost: number; notes: string }) => void; onCancel?: () => void }) {
  const [day, setDay] = useState(initial?.day ?? 1); const [title, setTitle] = useState(initial?.title ?? ''); const [cost, setCost] = useState(initial ? String(initial.cost) : ''); const [notes, setNotes] = useState(initial?.notes ?? ''); const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const c = cost.trim() === '' ? 0 : Number(cost);
    if (!title.trim()) { setErr('Enter an activity name.'); return; } if (!Number.isFinite(c) || c < 0) { setErr('Cost must be zero or more.'); return; }
    onSave({ day: Math.min(day, days), title: title.trim(), cost: c, notes }); if (!initial) { setTitle(''); setCost(''); setNotes(''); } setErr('');
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[6rem_1fr_8rem]" noValidate>
      <div><label htmlFor="i-day" className="mb-1 block text-xs text-silver">Day</label><select id="i-day" className="field" value={day} onChange={(e) => setDay(Number(e.target.value))}>{Array.from({ length: days }, (_, i) => <option key={i} value={i + 1}>Day {i + 1}</option>)}</select></div>
      <div><label htmlFor="i-title" className="mb-1 block text-xs text-silver">Activity</label><input id="i-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} data-autofocus={initial ? true : undefined} /></div>
      <div><label htmlFor="i-cost" className="mb-1 block text-xs text-silver">Est. cost (USD)</label><input id="i-cost" type="number" min={0} inputMode="decimal" className="field" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
      <div className="sm:col-span-3"><label htmlFor="i-notes" className="mb-1 block text-xs text-silver">Notes</label><input id="i-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} /></div>
      {err && <p role="alert" className="text-xs text-[#f0a090] sm:col-span-3">{err}</p>}
      <div className="flex gap-2 sm:col-span-3"><button className="btn btn-primary btn-sm" type="submit"><Plus size={14} aria-hidden />{initial ? 'Save item' : 'Add item'}</button>{onCancel && <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}

export default function Planner() {
  const { trips, setTrips, activeTripId, setActiveTripId, notify } = useApp();
  const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [confirm, setConfirm] = useState<null | { kind: 'trip' } | { kind: 'item'; id: string }>(null);
  const trip = trips.find((t) => t.id === activeTripId) ?? trips[0];
  useEffect(() => { if (trip && trip.id !== activeTripId) setActiveTripId(trip.id); }, [trip, activeTripId, setActiveTripId]);
  const days = trip ? tripDays(trip.startDate, trip.endDate) : 0;
  const stats = useMemo(() => {
    if (!trip) return null; const total = trip.items.reduce((s, i) => s + i.cost, 0); const done = trip.items.filter((i) => i.done).length;
    return { total, done, count: trip.items.length, pct: trip.items.length ? Math.round((done / trip.items.length) * 100) : 0, remaining: trip.budget - total };
  }, [trip]);
  const upd = (id: string, fn: (t: Trip) => Trip) => setTrips((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  const move = (it: ItineraryItem, dir: -1 | 1) => upd(trip.id, (t) => {
    const same = t.items.filter((x) => x.day === it.day); const idx = same.findIndex((x) => x.id === it.id); const swap = same[idx + dir]; if (!swap) return t;
    const items = [...t.items]; const a = items.findIndex((x) => x.id === it.id), b = items.findIndex((x) => x.id === swap.id); [items[a], items[b]] = [items[b], items[a]]; return { ...t, items };
  });
  const exportText = () => {
    const lines = [`${trip.name}${trip.destination ? ' · ' + trip.destination : ''}`, `${trip.startDate} to ${trip.endDate}`, ''];
    for (let d = 1; d <= days; d++) { lines.push(`Day ${d} (${dayLabel(trip.startDate, d)})`); trip.items.filter((i) => i.day === d).forEach((i) => lines.push(`  [${i.done ? 'x' : ' '}] ${i.title} · ${fmtMoney(i.cost)}${i.notes ? ' · ' + i.notes : ''}`)); lines.push(''); }
    lines.push(`Total estimated: ${fmtMoney(stats?.total ?? 0)}`, 'Planning notes only. Nothing here is booked or confirmed.');
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = `${trip.name.replace(/[^\w]+/g, '-').toLowerCase()}-itinerary.txt`; a.click(); URL.revokeObjectURL(url);
  };
  const create = (v: Omit<Trip, 'id' | 'items'>) => { const t: Trip = { id: uid('trip'), items: [], ...v }; setTrips((ts) => [...ts, t]); setActiveTripId(t.id); setCreating(false); notify('Trip created'); };

  return (
    <section id="planner" className="section bg-charcoal scroll-mt-16" aria-labelledby="plan-h">
      <div className="wrap">
        <p className="eyebrow no-print">Trip Planner</p>
        <h2 id="plan-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase no-print">Plan it day by day.</h2>
        <p className="mt-4 max-w-2xl text-silver no-print">Build an itinerary, track costs and tick things off. It is a planning tool only: nothing is booked, reserved or confirmed, and data stays in this browser.</p>

        {(trips.length === 0 || creating) ? (
          <div className="glass-solid mt-8 p-6 no-print">
            <h3 className="h-display text-2xl">{trips.length === 0 ? 'Start your first trip' : 'New trip'}</h3>
            <div className="mt-4"><TripForm onSave={create} onCancel={trips.length ? () => setCreating(false) : undefined} /></div>
          </div>
        ) : trip && stats && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="glass-solid print-area min-w-0 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 no-print">
                  <label htmlFor="trip-sel" className="sr-only">Select trip</label>
                  <select id="trip-sel" className="field !w-auto" value={trip.id} onChange={(e) => setActiveTripId(e.target.value)}>{trips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}><Plus size={14} aria-hidden /> New trip</button>
                </div>
                <div className="flex gap-2 no-print">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing((e) => !e)}><Pencil size={14} aria-hidden /> Edit trip</button>
                  <button className="btn btn-ghost btn-sm" onClick={exportText}><Download size={14} aria-hidden /> Export</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={14} aria-hidden /> Print</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: 'trip' })} aria-label={`Delete ${trip.name}`}><Trash2 size={14} aria-hidden /></button>
                </div>
              </div>
              {editing ? (
                <div className="mt-5 border border-white/10 p-4 no-print"><TripForm initial={trip} onCancel={() => setEditing(false)} onSave={(v) => {
                  const nd = tripDays(v.startDate, v.endDate); upd(trip.id, (t) => ({ ...t, ...v, items: t.items.map((i) => ({ ...i, day: Math.min(i.day, nd) })) })); setEditing(false); notify('Trip updated'); }} /></div>
              ) : (
                <div className="mt-5"><h3 className="h-display text-3xl">{trip.name}</h3><p className="text-sm text-silver">{trip.destination || 'No destination set'} · {days} day{days === 1 ? '' : 's'} · {dayLabel(trip.startDate, 1)} to {dayLabel(trip.startDate, days)}</p>{trip.notes && <p className="mt-2 text-sm text-ivory/80">{trip.notes}</p>}</div>
              )}
              <div className="mt-6 border border-white/10 p-4 no-print"><h4 className="mb-3 text-xs uppercase tracking-[.18em] text-silver">Add to itinerary</h4><ItemForm days={days} onSave={(v) => upd(trip.id, (t) => ({ ...t, items: [...t.items, { id: uid('it'), done: false, ...v }] }))} /></div>
              <ol className="mt-6 flex flex-col gap-6">
                {Array.from({ length: days }, (_, di) => di + 1).map((d) => { const its = trip.items.filter((i) => i.day === d); return (
                  <li key={d}><h4 className="flex items-baseline justify-between border-b border-white/15 pb-2"><span className="font-display text-xl">Day {d}</span><span className="text-xs text-silver">{dayLabel(trip.startDate, d)}</span></h4>
                    {its.length === 0 ? <p className="py-3 text-sm text-silver">Nothing planned for this day.</p> : (
                      <ul className="divide-y divide-white/10">{its.map((it, k) => (
                        <li key={it.id} className="flex flex-wrap items-center gap-3 py-3">
                          <input id={`done-${it.id}`} type="checkbox" className="h-5 w-5 accent-[#D8BD8A]" checked={it.done} onChange={() => upd(trip.id, (t) => ({ ...t, items: t.items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)) }))} />
                          <label htmlFor={`done-${it.id}`} className={`min-w-0 flex-1 ${it.done ? 'text-silver line-through' : ''}`}><span className="block">{it.title}</span>{it.notes && <span className="block text-xs text-silver">{it.notes}</span>}</label>
                          <span className="tabular-nums text-sm">{fmtMoney(it.cost)}</span>
                          <div className="flex gap-1.5 no-print">
                            <button className="btn btn-ghost btn-sm !px-2" disabled={k === 0} onClick={() => move(it, -1)} aria-label={`Move ${it.title} up`}><ArrowUp size={14} /></button>
                            <button className="btn btn-ghost btn-sm !px-2" disabled={k === its.length - 1} onClick={() => move(it, 1)} aria-label={`Move ${it.title} down`}><ArrowDown size={14} /></button>
                            <button className="btn btn-ghost btn-sm !px-2" onClick={() => setEditItem(it)} aria-label={`Edit ${it.title}`}><Pencil size={14} /></button>
                            <button className="btn btn-ghost btn-sm !px-2" onClick={() => setConfirm({ kind: 'item', id: it.id })} aria-label={`Delete ${it.title}`}><Trash2 size={14} /></button>
                          </div>
                        </li>))}</ul>)}
                  </li>); })}
              </ol>
            </div>
            <aside className="glass-solid h-fit min-w-0 p-5 print-area" aria-label="Budget summary">
              <h3 className="font-display text-2xl">Budget summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-silver">Total planned costs</dt><dd className="tabular-nums" data-testid="trip-total">{fmtMoney(stats.total)}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Your budget</dt><dd className="tabular-nums">{trip.budget ? fmtMoney(trip.budget) : 'Not set'}</dd></div>
                {trip.budget > 0 && <div className="flex justify-between"><dt className="text-silver">{stats.remaining >= 0 ? 'Remaining' : 'Over budget'}</dt><dd className={`tabular-nums ${stats.remaining < 0 ? 'text-[#f0a090]' : 'text-gold'}`}>{fmtMoney(Math.abs(stats.remaining))}</dd></div>}
              </dl>
              <div className="mt-6"><div className="flex justify-between text-xs text-silver"><span>Tasks complete</span><span>{stats.done} of {stats.count}</span></div>
                <div className="mt-2 h-2 bg-white/10" role="progressbar" aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Trip progress"><div className="h-full bg-gold transition-all" style={{ width: `${stats.pct}%` }} /></div></div>
              <p className="mt-6 text-xs text-silver">Costs are your own estimates. Nothing is booked or confirmed.</p>
            </aside>
          </div>
        )}
      </div>
      {editItem && trip && <Dialog title="Edit itinerary item" onClose={() => setEditItem(null)}><div className="p-6 pt-10"><h3 className="h-display mb-4 text-2xl">Edit item</h3>
        <ItemForm days={days} initial={editItem} onCancel={() => setEditItem(null)} onSave={(v) => { upd(trip.id, (t) => ({ ...t, items: t.items.map((x) => (x.id === editItem.id ? { ...x, ...v } : x)) })); setEditItem(null); notify('Item updated'); }} /></div></Dialog>}
      {confirm && trip && <ConfirmDialog title={confirm.kind === 'trip' ? 'Delete this trip?' : 'Delete this item?'} body={confirm.kind === 'trip' ? `"${trip.name}" and its itinerary will be removed from this browser.` : 'This itinerary item will be removed.'} confirmLabel="Delete" onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confirm.kind === 'trip') { setTrips((ts) => ts.filter((t) => t.id !== trip.id)); setActiveTripId(null); } else upd(trip.id, (t) => ({ ...t, items: t.items.filter((x) => x.id !== confirm.id) })); setConfirm(null); notify('Deleted'); }} />}
    </section>
  );
}
