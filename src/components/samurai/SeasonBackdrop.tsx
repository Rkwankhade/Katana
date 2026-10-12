// Four stacked layers, one per season. CSS (html[data-season]) decides which one is visible, so there is no React state, no
// hydration dependence and no flash: the boot script sets the attribute before first paint. Layers crossfade on opacity only.
const SEASON_LAYERS = ['spring', 'summer', 'autumn', 'winter'] as const;

export default function SeasonBackdrop({ kind, className = '' }: { kind: 'sky' | 'glow' | 'veil'; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none isolate ${className}`}>
      {SEASON_LAYERS.map((s) => <div key={s} data-s={s} className={`sb sb-${kind}`} />)}
    </div>
  );
}
