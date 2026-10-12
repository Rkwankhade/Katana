import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata = { title: 'Privacy Policy | AETHER' };
export default function Privacy() {
  return (<><Header home={false} /><main className="mx-auto max-w-3xl px-4 pb-20 pt-32">
    <h1 className="h-display text-4xl uppercase">Privacy Policy</h1><p className="mt-2 text-sm text-silver">Last updated: October 2026</p>
    <div className="mt-8 space-y-6 text-ivory/85 leading-relaxed">
      <section><h2 className="font-display text-2xl">Summary</h2><p className="mt-2">AETHER is a frontend-only web application. It has no server, no accounts and no database. We do not collect, transmit or sell your personal information.</p></section>
      <section><h2 className="font-display text-2xl">Data stored in your browser</h2><p className="mt-2">When you save items, create collections, plan trips, compare listings or create design projects, that data is saved in your browser&apos;s LocalStorage on this device and origin. Keys begin with &quot;aether:&quot;. It never leaves your device through AETHER, is not synced between devices, and can be erased by clearing your site data in your browser settings.</p></section>
      <section><h2 className="font-display text-2xl">Cookies and tracking</h2><p className="mt-2">AETHER does not set cookies and includes no analytics or advertising trackers.</p></section>
      <section><h2 className="font-display text-2xl">Third parties</h2><p className="mt-2">The application makes no calls to third-party APIs. Your hosting provider may keep ordinary server logs of page requests, governed by their own policy.</p></section>
      <section><h2 className="font-display text-2xl">Contact</h2><p className="mt-2">AETHER is a product concept without a registered business, so no contact address is provided.</p></section>
    </div></main><Footer home={false} /></>);
}
