'use client';
import { Bookmark, BookmarkCheck, Scale } from 'lucide-react';
import type { ItemRef } from '@/types';
import { useApp } from './AppState';

export function SaveButton({ r, label = false, small = true }: { r: ItemRef; label?: boolean; small?: boolean }) {
  const { isSaved, quickSave } = useApp(); const s = isSaved(r);
  return (
    <button onClick={(e) => { e.stopPropagation(); quickSave(r); }} aria-pressed={s} aria-label={s ? 'Remove from collections' : 'Save to collection'}
      className={`btn btn-ghost ${small ? 'btn-sm' : ''} ${s ? '!border-gold !text-gold' : ''}`}>
      {s ? <BookmarkCheck size={15} aria-hidden /> : <Bookmark size={15} aria-hidden />}{label && (s ? 'Saved' : 'Save')}
    </button>
  );
}
export function CompareButton({ kind, id, label = false }: { kind: 'property' | 'destination'; id: string; label?: boolean }) {
  const { compare, toggleCompare, notify } = useApp(); const on = compare.kind === kind && compare.ids.includes(id);
  return (
    <button onClick={(e) => { e.stopPropagation(); const m = toggleCompare(kind, id); if (m) notify(m); else notify(on ? 'Removed from comparison' : 'Added to comparison'); }} aria-pressed={on}
      aria-label={on ? 'Remove from comparison' : 'Add to comparison'} className={`btn btn-ghost btn-sm ${on ? '!border-gold !text-gold' : ''}`}>
      <Scale size={15} aria-hidden />{label && (on ? 'Comparing' : 'Compare')}
    </button>
  );
}
