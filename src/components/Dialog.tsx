'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { motionConfig } from '@/lib/motion';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/** Accessible modal: focus trap, Escape to close, focus restoration, scroll lock. */
export default function Dialog({ title, onClose, children, wide = false, side = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; side?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<HTMLElement | null>(null);
  useEffect(() => {
    prev.current = document.activeElement as HTMLElement; const el = ref.current; document.body.style.overflow = 'hidden';
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !el) return;
      const f = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev.current?.focus?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, x: side ? 40 : 0, y: side ? 0 : 24 }} animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: motionConfig.duration.base, ease: motionConfig.ease }}
        className={`glass-solid relative ${side ? 'ml-auto h-full w-full max-w-3xl' : `m-auto max-h-[92vh] w-[calc(100%-1.5rem)] ${wide ? 'max-w-5xl' : 'max-w-md'}`} overflow-y-auto`}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-white/20 bg-midnight/80 hover:border-gold"><X size={18} /></button>
        {children}
      </motion.div>
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <div className="p-6 pt-8">
        <h3 className="h-display text-2xl">{title}</h3>
        <p className="mt-3 text-sm text-silver">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onCancel} data-autofocus>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Dialog>
  );
}
