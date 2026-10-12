'use client';
import Crest from './Crest';

/**
 * INTEGRATION POINT for the journey map (a later phase). The map has not been built, so this is intentionally not mounted anywhere yet.
 * Render it at the journey's endpoint and set `active` when the route is complete: the crest turns a quarter turn and its halo blooms once.
 * All motion is off in Calm, reduced motion and tier 0 (CSS: html[data-still="true"]); the crest then simply sits there.
 */
export default function CrestBloom({ active, size = 96 }: { active: boolean; size?: number }) {
  return <Crest size={size} className={`crest-bloom ${active ? 'is-on' : ''}`} />;
}
