export default function About() {
  const items = [['Explore remarkable spaces', 'Browse homes, retreats and landmarks with filters that respond instantly.'], ['Discover meaningful destinations', 'Find places by how they feel, not only where they are.'], ['Organise creative inspiration', 'Save, compare and annotate what catches your eye.'], ['Turn ideas into actionable plans', 'Build itineraries and design projects you can return to.']];
  return (
    <section id="about" className="section bg-charcoal scroll-mt-16" aria-labelledby="about-h">
      <div className="wrap grid gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">About AETHER</p>
          <h2 id="about-h" className="h-display mt-3 text-[clamp(1.9rem,4.4vw,3.4rem)] uppercase">A better way to discover what inspires you.</h2>
          <p className="mt-5 text-silver">AETHER is a digital product concept that joins visual discovery with practical planning. It runs entirely in your browser, with no account and no server. The cinematic opening is a short original film; the listings and destinations are illustrative demonstration content.</p>
        </div>
        <ol className="grid gap-px bg-white/10">
          {items.map(([t, d], i) => (<li key={t} className="flex gap-5 bg-charcoal p-5"><span className="font-display text-3xl text-gold tabular-nums">0{i + 1}</span><div><h3 className="font-display text-xl">{t}</h3><p className="mt-1 text-sm text-silver">{d}</p></div></li>))}
        </ol>
      </div>
    </section>
  );
}
