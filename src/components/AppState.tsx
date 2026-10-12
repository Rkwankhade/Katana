'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Collection, ItemRef, Trip } from '@/types';
import { useStored } from '@/lib/useStored';
import { isCollections, isCompare, isTrips } from '@/lib/validation';
import { uid } from '@/lib/motion';

const DEFAULTS = ['Dream Spaces', 'Weekend Escapes', 'Architecture Inspiration'];
const makeDefaults = (): Collection[] => DEFAULTS.map((name, i) => ({ id: `col-default-${i}`, name, items: [], notes: {}, createdAt: new Date(2026, 0, 1).toISOString() }));
const same = (a: ItemRef, b: ItemRef) => a.kind === b.kind && a.id === b.id;

interface CompareState { kind: 'property' | 'destination'; ids: string[] }
interface Ctx {
  collections: Collection[];
  isSaved: (r: ItemRef) => boolean;
  savedIn: (r: ItemRef) => string[];
  toggleInCollection: (colId: string, r: ItemRef) => void;
  quickSave: (r: ItemRef) => void;
  createCollection: (name: string) => string | null;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  clearCollection: (id: string) => void;
  moveItem: (colId: string, idx: number, dir: -1 | 1) => void;
  setNote: (colId: string, r: ItemRef, note: string) => void;
  compare: CompareState; setCompareKind: (k: 'property' | 'destination') => void; toggleCompare: (kind: 'property' | 'destination', id: string) => string | null; clearCompare: () => void;
  trips: Trip[]; setTrips: (u: Trip[] | ((p: Trip[]) => Trip[])) => void; activeTripId: string | null; setActiveTripId: (id: string | null) => void;
  addToPlan: (title: string, ref: ItemRef, cost: number) => string;
  detail: ItemRef | null; openDetail: (r: ItemRef | null) => void;
  toast: string | null; notify: (m: string) => void;
}
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error('AppState missing'); return c; };

export function AppState({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useStored<Collection[]>('collections', makeDefaults(), isCollections);
  const [compare, setCompare] = useStored<CompareState>('compare', { kind: 'property', ids: [] }, isCompare);
  const [trips, setTrips] = useStored<Trip[]>('trips', [], isTrips);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ItemRef | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? null : t)), 2600); }, []);

  const isSaved = useCallback((r: ItemRef) => collections.some((c) => c.items.some((i) => same(i, r))), [collections]);
  const savedIn = useCallback((r: ItemRef) => collections.filter((c) => c.items.some((i) => same(i, r))).map((c) => c.id), [collections]);
  const toggleInCollection = useCallback((colId: string, r: ItemRef) => {
    setCollections((cs) => cs.map((c) => {
      if (c.id !== colId) return c;
      const has = c.items.some((i) => same(i, r));
      return { ...c, items: has ? c.items.filter((i) => !same(i, r)) : [...c.items, r] };
    }));
  }, [setCollections]);
  const quickSave = useCallback((r: ItemRef) => {
    const first = collections[0]; if (!first) return;
    if (isSaved(r)) { setCollections((cs) => cs.map((c) => ({ ...c, items: c.items.filter((i) => !same(i, r)) }))); notify('Removed from collections'); }
    else { toggleInCollection(first.id, r); notify(`Saved to ${first.name}`); }
  }, [collections, isSaved, setCollections, toggleInCollection, notify]);
  const createCollection = useCallback((name: string) => {
    const n = name.trim(); if (!n) return null;
    if (collections.some((c) => c.name.toLowerCase() === n.toLowerCase())) return null;
    const id = uid('col'); setCollections((cs) => [...cs, { id, name: n, items: [], notes: {}, createdAt: new Date().toISOString() }]); return id;
  }, [collections, setCollections]);
  const renameCollection = (id: string, name: string) => { const n = name.trim(); if (n) setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, name: n } : c))); };
  const deleteCollection = (id: string) => setCollections((cs) => cs.filter((c) => c.id !== id));
  const clearCollection = (id: string) => setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, items: [], notes: {} } : c)));
  const moveItem = (colId: string, idx: number, dir: -1 | 1) => setCollections((cs) => cs.map((c) => {
    if (c.id !== colId) return c; const j = idx + dir; if (j < 0 || j >= c.items.length) return c;
    const items = [...c.items]; [items[idx], items[j]] = [items[j], items[idx]]; return { ...c, items };
  }));
  const setNote = (colId: string, r: ItemRef, note: string) => setCollections((cs) => cs.map((c) => (c.id === colId ? { ...c, notes: { ...c.notes, [`${r.kind}:${r.id}`]: note } } : c)));

  const toggleCompare = useCallback((kind: 'property' | 'destination', id: string) => {
    let msg: string | null = null;
    setCompare((cur) => {
      const base = cur.kind === kind ? cur.ids : [];
      if (base.includes(id)) return { kind, ids: base.filter((x) => x !== id) };
      if (base.length >= 3) { msg = 'You can compare up to three items'; return cur; }
      if (cur.kind !== kind && cur.ids.length) msg = 'Comparison switched to ' + (kind === 'property' ? 'spaces' : 'destinations');
      return { kind, ids: [...base, id] };
    });
    return msg;
  }, [setCompare]);
  const setCompareKind = (k: 'property' | 'destination') => setCompare({ kind: k, ids: [] });
  const clearCompare = () => setCompare((c) => ({ ...c, ids: [] }));

  const addToPlan = useCallback((title: string, ref: ItemRef, cost: number) => {
    let tripId = activeTripId && trips.find((t) => t.id === activeTripId) ? activeTripId : trips[0]?.id ?? null;
    if (!tripId) {
      const today = new Date(); const iso = (d: Date) => d.toISOString().slice(0, 10); const end = new Date(today.getTime() + 2 * 86400000);
      tripId = uid('trip');
      const t: Trip = { id: tripId, name: 'My first trip', destination: '', startDate: iso(today), endDate: iso(end), items: [], budget: 0, notes: '' };
      setTrips((ts) => [...ts, t]);
    }
    const tid = tripId;
    setTrips((ts) => ts.map((t) => t.id === tid ? (t.items.some((i) => i.ref && i.ref.id === ref.id && i.ref.kind === ref.kind) ? t : { ...t, items: [...t.items, { id: uid('it'), day: 1, title, notes: '', cost, done: false, ref }] }) : t));
    setActiveTripId(tid);
    return tid;
  }, [activeTripId, trips, setTrips]);

  const value = useMemo<Ctx>(() => ({ collections, isSaved, savedIn, toggleInCollection, quickSave, createCollection, renameCollection, deleteCollection, clearCollection, moveItem, setNote,
    compare, setCompareKind, toggleCompare, clearCompare, trips, setTrips, activeTripId, setActiveTripId, addToPlan, detail, openDetail: setDetail, toast, notify }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, compare, trips, activeTripId, detail, toast, isSaved, savedIn, toggleInCollection, quickSave, toggleCompare, addToPlan]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
