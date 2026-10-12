'use client';
import { useEffect, useRef, useState } from 'react';
import { loadStored, saveStored } from './storage';

/** SSR-safe persisted state: renders fallback first, hydrates from storage after mount. */
export function useStored<T>(name: string, fallback: T, validate: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const fb = useRef(fallback);
  useEffect(() => { setValue(loadStored(name, fb.current, validate)); setReady(true); /* eslint-disable-next-line */ }, [name]);
  useEffect(() => { if (ready) saveStored(name, value); }, [name, value, ready]);
  return [value, setValue, ready] as const;
}
