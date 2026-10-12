import type { Ref } from 'react';

/**
 * The AETHER kamon with an optional glow halo. Presentational and decorative: the whole thing is aria-hidden. The halo is a separate
 * element so effects can animate its transform and opacity instead of a CSS filter. Effects (pulse, turn, spin, bloom) are applied
 * through classes defined in globals.css, all of which are off in Calm, reduced-motion and tier 0.
 */
export default function Crest({ size, className = '', imgClassName = '', ref }: { size: number; className?: string; imgClassName?: string; ref?: Ref<HTMLSpanElement> }) {
  return (
    <span ref={ref} aria-hidden="true" className={`crest ${className}`.trim()} style={{ width: size, height: size }}>
      <span className="crest-glow" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/samurai/kamon.svg" alt="" width={size} height={size} className={imgClassName} style={{ width: size, height: size }} />
    </span>
  );
}
