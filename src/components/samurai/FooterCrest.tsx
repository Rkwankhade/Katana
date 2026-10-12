'use client';
import { useEffect, useRef, useState } from 'react';
import { observeVisibility } from '@/lib/visibility';
import { useMotionOK, useTier } from '@/lib/preferences';
import Crest from './Crest';

/** Footer crest. Turns slowly, and only while it is on screen and motion is welcome (not Calm, not reduced motion, not tier 0). */
export default function FooterCrest() {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const motionOK = useMotionOK(); const tier = useTier();
  useEffect(() => { const el = ref.current; if (!el) return; return observeVisibility(el, setVisible, { fallback: false }); }, []);
  return <Crest ref={ref} size={32} className={visible && motionOK && tier > 0 ? 'crest-spin' : ''} />;
}
