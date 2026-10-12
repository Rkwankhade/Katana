import FooterCrest from '@/components/samurai/FooterCrest';

export default function Footer({ home = true }: { home?: boolean }) {
  const p = home ? '' : '/';
  const col = (title: string, links: [string, string][]) => (
    <nav aria-label={title}><h2 className="eyebrow">{title}</h2><ul className="mt-4 space-y-2 text-sm">{links.map(([l, h]) => <li key={l}><a className="text-ivory/80 hover:text-gold" href={h}>{l}</a></li>)}</ul></nav>
  );
  return (
    <footer className="border-t border-white/10 bg-midnight px-4 py-14">
      <div className="mx-auto grid max-w-[1240px] gap-10 md:grid-cols-4">
        <div><p className="flex items-center gap-3 font-display text-2xl tracking-[.38em]"><FooterCrest />AETHER</p><p className="mt-3 max-w-xs text-sm text-silver">Find a place that changes your perspective.</p></div>
        {col('Explore', [['Spaces', p + '#explore'], ['Destinations', p + '#destinations'], ['Featured', p + '#featured']])}
        {col('Product', [['Collections', p + '#collections'], ['Compare', p + '#compare'], ['Planner', p + '#planner'], ['Design Studio', p + '#studio']])}
        {col('Legal', [['Privacy Policy', '/privacy/'], ['Terms and Conditions', '/terms/']])}
      </div>
      <p className="mx-auto mt-12 flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-silver"><span>© 2026 AETHER. A digital product concept. Listings and destinations are illustrative.</span><span lang="ja" className="font-jp tracking-[.4em] text-gold/80" aria-label="The way">道</span></p>
    </footer>
  );
}
