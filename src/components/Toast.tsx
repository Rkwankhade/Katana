'use client';
import { useApp } from './AppState';
export default function Toast() {
  const { toast } = useApp();
  return <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 md:bottom-6">{toast && <p className="glass-solid a-fade-up px-4 py-2.5 text-sm">{toast}</p>}</div>;
}
