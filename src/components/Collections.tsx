'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { propertyById } from '@/data/properties';
import { destinationById } from '@/data/destinations';
import { refById } from '@/data/references';
import type { Collection, ItemRef } from '@/types';
import { useApp } from './AppState';
import { ConfirmDialog } from './Dialog';

function resolve(r: ItemRef): { title: string; sub: string; image: string } | null {
  if (r.kind === 'property') { const p = propertyById(r.id); return p ? { title: p.name, sub: p.category, image: p.image } : null; }
  if (r.kind === 'destination') { const d = destinationById(r.id); return d ? { title: d.name, sub: d.category, image: d.image } : null; }
  const f = refById(r.id); return f ? { title: f.title, sub: f.group, image: f.image } : null;
}

export default function Collections() {
  const { collections, createCollection, renameCollection, deleteCollection, clearCollection, moveItem, setNote, toggleInCollection, openDetail, notify } = useApp();
  const [sel, setSel] = useState<string>(collections[0]?.id ?? '');
  const [name, setName] = useState(''); const [err, setErr] = useState('');
  const [renaming, setRenaming] = useState(false); const [rename, setRename] = useState('');
  const [confirm, setConfirm] = useState<null | { kind: 'clear' | 'delete'; c: Collection }>(null);
  const cur = collections.find((c) => c.id === sel) ?? collections[0];

  const add = () => {
    const n = name.trim(); if (!n) { setErr('Enter a name for the collection.'); return; }
    const id = createCollection(n); if (!id) { setErr('A collection with that name already exists.'); return; }
    setName(''); setErr(''); setSel(id); notify('Collection created');
  };
  return (
    <section id="collections" className="section bg-charcoal scroll-mt-16" aria-labelledby="col-h">
      <div className="wrap">
        <p className="eyebrow">Collections</p>
        <h2 id="col-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase">Keep what moves you.</h2>
        <p className="mt-4 max-w-2xl text-silver">Collections are saved in this browser only. They are not synced across devices.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div>
            <ul className="flex flex-col gap-px bg-white/10" aria-label="Your collections">
              {collections.map((c) => (
                <li key={c.id}><button onClick={() => { setSel(c.id); setRenaming(false); }} aria-current={cur?.id === c.id} className={`flex w-full items-center justify-between bg-charcoal px-4 py-3 text-left text-sm ${cur?.id === c.id ? 'text-gold shadow-[inset_3px_0_0_#D8BD8A]' : 'text-ivory hover:text-gold'}`}>
                  <span>{c.name}</span><span className="tabular-nums text-xs text-silver">{c.items.length}</span></button></li>
              ))}
            </ul>
            <form className="mt-4" onSubmit={(e) => { e.preventDefault(); add(); }}>
              <label htmlFor="newcol" className="mb-1 block text-xs text-silver">New collection</label>
              <div className="flex gap-2"><input id="newcol" className="field" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} maxLength={40} placeholder="Name" aria-invalid={!!err} aria-describedby={err ? 'col-err' : undefined} />
                <button type="submit" className="btn btn-primary !px-3" aria-label="Create collection"><Plus size={18} /></button></div>
              {err && <p id="col-err" role="alert" className="mt-1 text-xs text-[#f0a090]">{err}</p>}
            </form>
          </div>
          <div className="glass-solid min-h-[18rem] p-5">
            {!cur ? <p className="text-silver">No collections yet. Create one to start saving.</p> : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {renaming ? (
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (rename.trim()) { renameCollection(cur.id, rename); setRenaming(false); notify('Renamed'); } }}>
                      <label htmlFor="ren" className="sr-only">Collection name</label><input id="ren" className="field" value={rename} onChange={(e) => setRename(e.target.value)} maxLength={40} data-autofocus autoFocus />
                      <button className="btn btn-primary btn-sm" type="submit">Save</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(false)}>Cancel</button>
                    </form>
                  ) : <h3 className="h-display text-3xl">{cur.name}</h3>}
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setRename(cur.name); setRenaming(true); }}><Pencil size={14} aria-hidden /> Rename</button>
                    <button className="btn btn-ghost btn-sm" disabled={cur.items.length === 0} onClick={() => setConfirm({ kind: 'clear', c: cur })}>Clear</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: 'delete', c: cur })} aria-label={`Delete ${cur.name}`}><Trash2 size={14} aria-hidden /></button>
                  </div>
                </div>
                {cur.items.length === 0 ? (
                  <div className="mt-8 border border-dashed border-white/20 p-10 text-center"><p className="h-display text-xl">Nothing saved here yet.</p><p className="mt-2 text-sm text-silver">Use the save button on any space, destination or reference.</p>
                    <a href="#explore" className="btn btn-ghost mt-5">Explore spaces</a></div>
                ) : (
                  <ul className="mt-5 grid gap-4">
                    {cur.items.map((r, i) => { const info = resolve(r); const key = `${r.kind}:${r.id}`; return (
                      <li key={key} className="flex flex-col gap-4 border border-white/10 p-3 sm:flex-row">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={info?.image ?? '/img/coastal-villa.svg'} alt="" className="h-28 w-full object-cover sm:w-44" loading="lazy" />
                        <div className="flex-1">
                          <p className="eyebrow">{r.kind}</p><p className="font-display text-xl">{info?.title ?? 'Item no longer available'}</p><p className="text-xs text-silver">{info?.sub}</p>
                          <label htmlFor={`n-${key}`} className="sr-only">Note for {info?.title}</label>
                          <textarea id={`n-${key}`} className="field mt-2 !min-h-[56px]" rows={2} placeholder="Personal note" value={cur.notes[key] ?? ''} onChange={(e) => setNote(cur.id, r, e.target.value)} maxLength={500} />
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          {r.kind !== 'reference' && <button className="btn btn-ghost btn-sm" onClick={() => openDetail(r)}>Open</button>}
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => moveItem(cur.id, i, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
                            <button className="btn btn-ghost btn-sm" disabled={i === cur.items.length - 1} onClick={() => moveItem(cur.id, i, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleInCollection(cur.id, r)} aria-label={`Remove ${info?.title ?? 'item'}`}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </li>); })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog title={confirm.kind === 'clear' ? 'Clear this collection?' : 'Delete this collection?'}
          body={confirm.kind === 'clear' ? `All items and notes in "${confirm.c.name}" will be removed from this browser.` : `"${confirm.c.name}" and everything in it will be removed from this browser.`}
          confirmLabel={confirm.kind === 'clear' ? 'Clear' : 'Delete'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { if (confirm.kind === 'clear') clearCollection(confirm.c.id); else { deleteCollection(confirm.c.id); setSel(''); } setConfirm(null); notify(confirm.kind === 'clear' ? 'Collection cleared' : 'Collection deleted'); }} />
      )}
    </section>
  );
}
