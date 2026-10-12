'use client';
import { useEffect, useRef, useState } from 'react';
import { useHydrated, useSeason, type Season } from '@/lib/preferences';

const SRC: Record<Season, { right: string; left: string }> = {
  spring: { right: '/img/samurai/sakura-branch.svg', left: '/img/samurai/sakura-branch-left.svg' },
  summer: { right: '/img/samurai/branch-summer.svg', left: '/img/samurai/branch-summer-left.svg' },
  autumn: { right: '/img/samurai/branch-autumn.svg', left: '/img/samurai/branch-autumn-left.svg' },
  winter: { right: '/img/samurai/branch-winter.svg', left: '/img/samurai/branch-winter-left.svg' },
};

/**
 * The branch in the parallax scene. Only seasons that have been shown are mounted (lazily, so a visitor never downloads the other
 * three), and they crossfade on opacity. Server markup and hydration always render spring, matching the original; the real season
 * arrives in the same pass that hydration finishes, and the placeholder spring image is dropped if it was not the real one.
 * Place inside a wrapper with `grid` so the stacked images overlap.
 */
export default function SeasonBranch({ side, width = 900, height = 520 }: { side: 'right' | 'left'; width?: number; height?: number }) {
  const season = useSeason(); const hydrated = useHydrated();
  const [seen, setSeen] = useState<Season[]>(['spring']);
  const settled = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!settled.current) { settled.current = true; setSeen([season]); return; }
    setSeen((s) => (s.includes(season) ? s : [...s, season]));
  }, [season, hydrated]);
  return (
    <>
      {seen.map((s) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={s} src={SRC[s][side]} alt="" width={width} height={height} loading="lazy" decoding="async" aria-hidden
          data-on={hydrated ? String(s === season) : 'true'} className="season-img w-full [grid-area:1/1]" />
      ))}
    </>
  );
}
