import Reveal from './Reveal';
import Crest from './Crest';
import KatanaReveal from './KatanaReveal';

/**
 * Section break. "katana" slides a blade between two ink lines; "kamon" turns a crest between them; "katana-reveal" swaps the blade for the
 * interactive KatanaReveal. That one is a control, not decoration, so only its ink lines are hidden from assistive technology.
 */
export default function SamuraiDivider({ variant = 'katana', tone = 'bg-midnight' }: { variant?: 'katana' | 'kamon' | 'katana-reveal'; tone?: string }) {
  if (variant === 'katana-reveal') {
    return (
      <Reveal className={`${tone} px-4 py-10 md:py-14`}>
        <div className="div-wrap mx-auto flex max-w-[1240px] items-center gap-4 md:gap-8">
          <span aria-hidden className="div-line div-l h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/80" />
          {/* width leaves room for the page padding and both gaps, so the sword never overflows a narrow screen */}
          <KatanaReveal className="w-[min(760px,calc(100vw-4rem))] flex-none md:w-[min(760px,calc(100vw-6rem))]" />
          <span aria-hidden className="div-line div-r h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/80" />
        </div>
      </Reveal>
    );
  }
  return (
    <Reveal className={`${tone} px-4 py-10 md:py-14`}>
      <div className="div-wrap mx-auto flex max-w-[1240px] items-center gap-4 md:gap-8" aria-hidden>
        <span className="div-line div-l h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/80" />
        {variant === 'katana'
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src="/img/samurai/katana.svg" alt="" width={900} height={60} loading="lazy" decoding="async" className="div-blade w-[min(520px,56vw)]" />
          // eslint-disable-next-line @next/next/no-img-element
          : <Crest size={56} className="crest-div" imgClassName="div-kamon" />}
        <span className="div-line div-r h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/80" />
      </div>
    </Reveal>
  );
}
