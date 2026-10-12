'use client';
import { useState } from 'react';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import type { DesignProject } from '@/types';
import { referenceLibrary } from '@/data/references';
import { useStored } from '@/lib/useStored';
import { isProjects } from '@/lib/validation';
import { uid } from '@/lib/motion';
import { useApp } from './AppState';
import { ConfirmDialog } from './Dialog';

const TYPES = ['New build', 'Renovation', 'Interior refresh', 'Landscape', 'Hospitality fit-out'];
const PALETTES: { name: string; colors: string[] }[] = [
  { name: 'Midnight and brass', colors: ['#080E16', '#172433', '#A8B2C0', '#D8BD8A', '#F4F0E8'] },
  { name: 'Coastal sand', colors: ['#E9DFCF', '#C9B28F', '#7C8F94', '#34505E', '#1B2B38'] },
  { name: 'Forest timber', colors: ['#1F2A22', '#4B5A45', '#8A7456', '#C7B79A', '#EFE9DC'] },
  { name: 'Concrete and stone', colors: ['#2B2E31', '#5B6066', '#9A9EA3', '#CFCFCB', '#F2F1EC'] },
];
const hex = /^#[0-9a-f]{6}$/i;

export default function DesignStudio() {
  const { quickSave, isSaved, notify } = useApp();
  const [projects, setProjects] = useStored<DesignProject[]>('design-projects', [], isProjects);
  const [selId, setSelId] = useState<string | null>(null);
  const [name, setName] = useState(''); const [type, setType] = useState(TYPES[0]); const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [mat, setMat] = useState({ name: '', note: '' }); const [task, setTask] = useState(''); const [dim, setDim] = useState({ room: '', width: '', length: '', height: '' }); const [dimErr, setDimErr] = useState('');
  const [custom, setCustom] = useState('#D8BD8A'); const [group, setGroup] = useState('All');
  const p = projects.find((x) => x.id === selId) ?? projects[0];
  const upd = (fn: (p: DesignProject) => DesignProject) => p && setProjects((ps) => ps.map((x) => (x.id === p.id ? fn(x) : x)));
  const groups = ['All', ...Array.from(new Set(referenceLibrary.map((r) => r.group)))];

  const create = (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) { setErr('Name your project.'); return; }
    const np: DesignProject = { id: uid('proj'), name: name.trim(), projectType: type, references: [], palette: PALETTES[0].colors.slice(0, 3), materials: [], dimensions: [], tasks: [], notes: '' };
    setProjects((ps) => [...ps, np]); setSelId(np.id); setName(''); setErr(''); notify('Project created');
  };
  const addDim = (e: React.FormEvent) => {
    e.preventDefault(); const w = Number(dim.width), l = Number(dim.length), h = Number(dim.height);
    if (!dim.room.trim() || !(w > 0) || !(l > 0) || !(h > 0)) { setDimErr('Enter a room name and positive width, length and height.'); return; }
    if (w > 100 || l > 100 || h > 30) { setDimErr('Those values look too large. Use metres.'); return; }
    upd((x) => ({ ...x, dimensions: [...x.dimensions, { room: dim.room.trim(), width: w, length: l, height: h }] })); setDim({ room: '', width: '', length: '', height: '' }); setDimErr('');
  };
  const panel = 'glass-solid p-5';

  return (
    <section id="studio" className="section bg-midnight scroll-mt-16" aria-labelledby="studio-h">
      <div className="wrap">
        <p className="eyebrow">Design Studio</p>
        <h2 id="studio-h" className="h-display mt-3 text-[clamp(2rem,5vw,4rem)] uppercase">Bring your ideas to life.</h2>
        <p className="mt-4 max-w-2xl text-silver">Collect references, set a palette, note materials and room sizes, and track tasks. This is an organising tool, not 3D modelling, structural engineering or cost estimation. Projects stay in this browser.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div className="flex flex-col gap-4">
            <form onSubmit={create} className={panel} noValidate>
              <h3 className="font-display text-xl">New project</h3>
              <label htmlFor="pn" className="mb-1 mt-3 block text-xs text-silver">Project name</label><input id="pn" className="field" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} maxLength={60} aria-invalid={!!err} />
              {err && <p role="alert" className="mt-1 text-xs text-[#f0a090]">{err}</p>}
              <label htmlFor="pt" className="mb-1 mt-3 block text-xs text-silver">Project type</label><select id="pt" className="field" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <button className="btn btn-primary mt-4 w-full" type="submit"><Plus size={14} aria-hidden /> Create project</button>
            </form>
            <div className={panel}><h3 className="font-display text-xl">Saved projects</h3>
              {projects.length === 0 ? <p className="mt-3 text-sm text-silver">No projects yet.</p> : (
                <ul className="mt-3 flex flex-col gap-px bg-white/10">{projects.map((x) => (<li key={x.id}><button onClick={() => setSelId(x.id)} aria-current={p?.id === x.id} className={`w-full bg-[#0b111a] px-3 py-2.5 text-left text-sm ${p?.id === x.id ? 'text-gold shadow-[inset_3px_0_0_#D8BD8A]' : 'hover:text-gold'}`}>{x.name}<span className="block text-xs text-silver">{x.projectType}</span></button></li>))}</ul>)}
            </div>
          </div>

          {!p ? (
            <div className="glass flex min-h-[20rem] items-center justify-center p-10 text-center"><div><p className="h-display text-2xl">Create a project to begin.</p><p className="mt-2 text-sm text-silver">Your mood board, palette, materials, rooms and tasks live here.</p></div></div>
          ) : (
            <div className="grid gap-6">
              <div className={`${panel} flex flex-wrap items-start justify-between gap-3`}>
                <div><p className="eyebrow">{p.projectType}</p><h3 className="h-display text-3xl">{p.name}</h3></div>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(true)}><Trash2 size={14} aria-hidden /> Delete project</button>
              </div>

              <div className={panel}>
                <h4 className="font-display text-xl">Mood board</h4>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Reference group">{groups.map((g) => <button key={g} aria-pressed={group === g} className={`btn btn-ghost btn-sm ${group === g ? '!border-gold !text-gold' : ''}`} onClick={() => setGroup(g)}>{g}</button>)}</div>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Reference library">
                  {referenceLibrary.filter((r) => group === 'All' || r.group === group).map((r) => { const on = p.references.some((x) => x.id === r.id); return (
                    <li key={r.id} className="relative"><button aria-pressed={on} onClick={() => upd((x) => ({ ...x, references: on ? x.references.filter((y) => y.id !== r.id) : [...x.references, r] }))} className={`block w-full overflow-hidden border text-left ${on ? 'border-gold' : 'border-white/15'}`} aria-label={`${on ? 'Remove' : 'Add'} ${r.title}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={r.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" /><span className="block px-2 py-1.5 text-xs">{r.title}{on && <span className="ml-1 text-gold">Added</span>}</span></button></li>); })}
                </ul>
                <h5 className="mt-6 text-xs uppercase tracking-[.18em] text-silver">On your board ({p.references.length})</h5>
                {p.references.length === 0 ? <p className="mt-2 text-sm text-silver">Select references above to build your board.</p> : (
                  <div className="mt-3 columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
                    {p.references.map((r, i) => (<figure key={r.id} className="relative break-inside-avoid border border-white/15">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={r.image} alt={r.title} className={`w-full object-cover ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`} loading="lazy" />
                      <figcaption className="flex items-center justify-between gap-1 p-2 text-xs"><span>{r.title}</span>
                        <span className="flex gap-1"><button className={`grid h-8 w-8 place-items-center border ${isSaved({ kind: 'reference', id: r.id }) ? 'border-gold text-gold' : 'border-white/20'}`} aria-label={`Save ${r.title} to collections`} aria-pressed={isSaved({ kind: 'reference', id: r.id })} onClick={() => quickSave({ kind: 'reference', id: r.id })}><Bookmark size={13} /></button>
                          <button className="grid h-8 w-8 place-items-center border border-white/20 hover:border-gold" aria-label={`Remove ${r.title} from board`} onClick={() => upd((x) => ({ ...x, references: x.references.filter((y) => y.id !== r.id) }))}><X size={13} /></button></span></figcaption></figure>))}
                  </div>)}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={panel}>
                  <h4 className="font-display text-xl">Palette</h4>
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Project palette">{p.palette.map((c, i) => (<li key={c + i} className="text-center"><span className="block h-14 w-14 border border-white/25" style={{ background: c }} role="img" aria-label={`Colour ${c}`} />
                    <button className="mt-1 text-[.65rem] uppercase text-silver hover:text-ivory" onClick={() => upd((x) => ({ ...x, palette: x.palette.filter((_, j) => j !== i) }))} aria-label={`Remove colour ${c}`}>{c}<X size={9} className="ml-0.5 inline" /></button></li>))}
                    {p.palette.length === 0 && <li className="text-sm text-silver">No colours yet.</li>}</ul>
                  <h5 className="mt-4 text-xs uppercase tracking-[.18em] text-silver">Presets</h5>
                  <div className="mt-2 flex flex-col gap-2">{PALETTES.map((pl) => (<button key={pl.name} className="flex items-center justify-between border border-white/15 p-2 text-left text-sm hover:border-gold" onClick={() => { upd((x) => ({ ...x, palette: pl.colors })); notify(`Palette: ${pl.name}`); }}>
                    <span>{pl.name}</span><span className="flex">{pl.colors.map((c) => <span key={c} className="h-5 w-5" style={{ background: c }} />)}</span></button>))}</div>
                  <form className="mt-4 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (hex.test(custom) && p.palette.length < 8 && !p.palette.includes(custom.toUpperCase())) upd((x) => ({ ...x, palette: [...x.palette, custom.toUpperCase()] })); else notify(p.palette.length >= 8 ? 'A palette holds up to 8 colours' : 'Colour already in palette'); }}>
                    <div><label htmlFor="cc" className="mb-1 block text-xs text-silver">Custom colour</label><input id="cc" type="color" className="h-[42px] w-16 border border-white/20 bg-transparent" value={custom} onChange={(e) => setCustom(e.target.value)} /></div>
                    <button className="btn btn-ghost btn-sm" type="submit">Add colour</button></form>
                </div>
                <div className={panel}>
                  <h4 className="font-display text-xl">Materials</h4>
                  <form className="mt-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); if (!mat.name.trim()) return; upd((x) => ({ ...x, materials: [...x.materials, { id: uid('m'), name: mat.name.trim(), note: mat.note.trim() }] })); setMat({ name: '', note: '' }); }}>
                    <label htmlFor="mn" className="sr-only">Material</label><input id="mn" className="field" placeholder="Material, e.g. Charred cedar" value={mat.name} onChange={(e) => setMat({ ...mat, name: e.target.value })} maxLength={60} />
                    <label htmlFor="mo" className="sr-only">Material note</label><input id="mo" className="field" placeholder="Where it is used (optional)" value={mat.note} onChange={(e) => setMat({ ...mat, note: e.target.value })} maxLength={120} />
                    <button className="btn btn-ghost btn-sm w-fit" type="submit"><Plus size={14} aria-hidden /> Add material</button></form>
                  {p.materials.length === 0 ? <p className="mt-3 text-sm text-silver">No materials recorded.</p> : <ul className="mt-3 divide-y divide-white/10">{p.materials.map((m) => (<li key={m.id} className="flex items-start justify-between gap-2 py-2 text-sm"><span>{m.name}{m.note && <span className="block text-xs text-silver">{m.note}</span>}</span>
                    <button className="grid h-8 w-8 shrink-0 place-items-center border border-white/20 hover:border-gold" aria-label={`Remove ${m.name}`} onClick={() => upd((x) => ({ ...x, materials: x.materials.filter((y) => y.id !== m.id) }))}><X size={13} /></button></li>))}</ul>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={panel}>
                  <h4 className="font-display text-xl">Room dimensions</h4>
                  <form className="mt-3 grid grid-cols-3 gap-2" onSubmit={addDim} noValidate>
                    <div className="col-span-3"><label htmlFor="dr" className="mb-1 block text-xs text-silver">Room</label><input id="dr" className="field" value={dim.room} onChange={(e) => setDim({ ...dim, room: e.target.value })} maxLength={40} /></div>
                    {(['width', 'length', 'height'] as const).map((k) => (<div key={k}><label htmlFor={`d-${k}`} className="mb-1 block text-xs capitalize text-silver">{k} (m)</label><input id={`d-${k}`} type="number" min={0} step="0.1" inputMode="decimal" className="field" value={dim[k]} onChange={(e) => setDim({ ...dim, [k]: e.target.value })} /></div>))}
                    {dimErr && <p role="alert" className="col-span-3 text-xs text-[#f0a090]">{dimErr}</p>}
                    <button className="btn btn-ghost btn-sm col-span-3 w-fit" type="submit"><Plus size={14} aria-hidden /> Add room</button></form>
                  {p.dimensions.length === 0 ? <p className="mt-3 text-sm text-silver">No rooms measured yet.</p> : <ul className="mt-3 divide-y divide-white/10">{p.dimensions.map((d, i) => (<li key={i} className="flex items-center justify-between gap-2 py-2 text-sm"><span>{d.room}<span className="block text-xs text-silver">{d.width} × {d.length} × {d.height} m · floor {(d.width * d.length).toFixed(1)} m² · volume {(d.width * d.length * d.height).toFixed(1)} m³</span></span>
                    <button className="grid h-8 w-8 shrink-0 place-items-center border border-white/20 hover:border-gold" aria-label={`Remove ${d.room}`} onClick={() => upd((x) => ({ ...x, dimensions: x.dimensions.filter((_, j) => j !== i) }))}><X size={13} /></button></li>))}</ul>}
                </div>
                <div className={panel}>
                  <h4 className="font-display text-xl">Tasks</h4>
                  <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!task.trim()) return; upd((x) => ({ ...x, tasks: [...x.tasks, { id: uid('tk'), text: task.trim(), done: false }] })); setTask(''); }}>
                    <label htmlFor="tk" className="sr-only">New task</label><input id="tk" className="field" placeholder="Add a task" value={task} onChange={(e) => setTask(e.target.value)} maxLength={100} /><button className="btn btn-ghost btn-sm" type="submit" aria-label="Add task"><Plus size={16} /></button></form>
                  {p.tasks.length === 0 ? <p className="mt-3 text-sm text-silver">No tasks yet.</p> : (<>
                    <p className="mt-3 text-xs text-silver">{p.tasks.filter((t) => t.done).length} of {p.tasks.length} complete</p>
                    <ul className="mt-2 divide-y divide-white/10">{p.tasks.map((t) => (<li key={t.id} className="flex items-center gap-3 py-2 text-sm"><input id={`tk-${t.id}`} type="checkbox" className="h-5 w-5 accent-[#D8BD8A]" checked={t.done} onChange={() => upd((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? { ...y, done: !y.done } : y)) }))} />
                      <label htmlFor={`tk-${t.id}`} className={`flex-1 ${t.done ? 'text-silver line-through' : ''}`}>{t.text}</label>
                      <button className="grid h-8 w-8 place-items-center border border-white/20 hover:border-gold" aria-label={`Delete task ${t.text}`} onClick={() => upd((x) => ({ ...x, tasks: x.tasks.filter((y) => y.id !== t.id) }))}><X size={13} /></button></li>))}</ul></>)}
                </div>
              </div>

              <div className={panel}><h4 className="font-display text-xl"><label htmlFor="pnotes">Project notes</label></h4>
                <textarea id="pnotes" className="field mt-3" rows={5} value={p.notes} onChange={(e) => upd((x) => ({ ...x, notes: e.target.value }))} maxLength={4000} placeholder="Design intent, constraints, questions for your architect" /></div>
            </div>
          )}
        </div>
      </div>
      {confirmDel && p && <ConfirmDialog title="Delete this project?" body={`"${p.name}" and everything in it will be removed from this browser.`} confirmLabel="Delete" onCancel={() => setConfirmDel(false)}
        onConfirm={() => { setProjects((ps) => ps.filter((x) => x.id !== p.id)); setSelId(null); setConfirmDel(false); notify('Project deleted'); }} />}
    </section>
  );
}
