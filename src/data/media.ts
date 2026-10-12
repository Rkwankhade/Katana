// Hero media sources and the integration point for future cinematic footage.
//
// The shipped footage is public/media/aether-hero.mp4: 10 seconds, kept byte-identical to the original (sha256 d9cf2a8a...c4d8).
// It is never re-encoded, cropped or replaced. Chapter timing in src/data/chapters.ts is calibrated to that 10 second file.
//
// To add the planned 24 second master later: drop the file in public/media/, set `master24` below, and add a chapter table
// calibrated to it. `master24` is null today because that footage does not exist in this repository.
import type { Tier } from '@/lib/preferences-core';

export interface HeroSource { src: string; /** seconds, used until the browser reports the real duration */ duration: number }

export const heroMedia = {
  poster: '/media/aether-poster.jpg',
  original: { src: '/media/aether-hero.mp4', duration: 10 } as HeroSource,
  /** Future 24 second master. Not generated, not present. */
  master24: null as HeroSource | null,
  /** Future lightweight rendition for Tier 1. Not generated, not present; Tier 1 uses the original until it exists. */
  lightweight: null as HeroSource | null,
};

/** Tier 0 returns null: show the poster only, never load or scrub video. */
export function pickHeroSource(tier: Tier): HeroSource | null {
  if (tier === 0) return null;
  if (tier === 1) return heroMedia.lightweight ?? heroMedia.original;
  return heroMedia.master24 ?? heroMedia.original;
}
