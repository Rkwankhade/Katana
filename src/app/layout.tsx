import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PreferencesProvider } from '@/lib/preferences';
import { BOOT_SCRIPT } from '@/lib/bootScript';

export const metadata: Metadata = {
  title: 'AETHER | Find a place that changes your perspective',
  icons: { icon: '/img/samurai/kamon.svg' },
  description: 'A cinematic discovery and planning concept for exceptional spaces, destinations and design. Runs entirely in your browser.',
};
export const viewport: Viewport = { themeColor: '#080E16', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: browser extensions (e.g. "crxemulator", Grammarly, dark-mode tools) inject attributes onto
  // <html>/<body> before React hydrates. That is outside the app's control and harmless, so the warning is silenced
  // on these two elements only. Mismatches anywhere else in the tree are still reported.
  // The same applies to the data-calm / data-tier / data-still attributes that BOOT_SCRIPT sets on <html> before paint.
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} /></head>
      <body suppressHydrationWarning><PreferencesProvider>{children}</PreferencesProvider></body>
    </html>
  );
}
