import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata = { title: 'Terms and Conditions | AETHER' };
export default function Terms() {
  return (<><Header home={false} /><main className="mx-auto max-w-3xl px-4 pb-20 pt-32">
    <h1 className="h-display text-4xl uppercase">Terms and Conditions</h1><p className="mt-2 text-sm text-silver">Last updated: October 2026</p>
    <div className="mt-8 space-y-6 text-ivory/85 leading-relaxed">
      <section><h2 className="font-display text-2xl">A product concept</h2><p className="mt-2">AETHER is a digital product concept. All spaces, destinations, prices, areas, amenities and descriptions are illustrative demonstration content with original illustrations. They are not real offers, valuations or advice.</p></section>
      <section><h2 className="font-display text-2xl">No bookings or sales</h2><p className="mt-2">Nothing in AETHER can be bought, booked, reserved or confirmed. The Trip Planner is a personal planning aid only, and the Design Studio is an organising tool, not professional architectural, engineering or cost advice.</p></section>
      <section><h2 className="font-display text-2xl">Your data</h2><p className="mt-2">Your saved data lives only in your browser and may be lost if you clear site data or change browsers. Keep your own copy of anything important, for example with the itinerary export.</p></section>
      <section><h2 className="font-display text-2xl">No warranty</h2><p className="mt-2">The application is provided as is, without warranty of any kind, to the extent permitted by law.</p></section>
    </div></main><Footer home={false} /></>);
}
