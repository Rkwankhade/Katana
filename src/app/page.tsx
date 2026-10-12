'use client';
import dynamic from 'next/dynamic';
import { AppState } from '@/components/AppState';
import Header from '@/components/Header';
import Cinematic from '@/components/Cinematic';
import Explore from '@/components/Explore';
import Featured from '@/components/Featured';
import Destinations from '@/components/Destinations';
import About from '@/components/About';
import Footer from '@/components/Footer';
import DetailHost from '@/components/Detail';
import Toast from '@/components/Toast';
import Reveal from '@/components/samurai/Reveal';
import SamuraiDivider from '@/components/samurai/SamuraiDivider';
import PathOfSamurai from '@/components/samurai/PathOfSamurai';
import Bushido from '@/components/samurai/Bushido';
import ScrollProgress from '@/components/samurai/ScrollProgress';
import Petals from '@/components/samurai/Petals';
import SeasonAtmosphere from '@/components/samurai/SeasonAtmosphere';

// Heavy, below-the-fold tools are split into their own chunks (still server-rendered, so no layout shift).
const Collections = dynamic(() => import('@/components/Collections'));
const Compare = dynamic(() => import('@/components/Compare'));
const Planner = dynamic(() => import('@/components/Planner'));
const DesignStudio = dynamic(() => import('@/components/DesignStudio'));

export default function Home() {
  return (
    <AppState>
      <ScrollProgress />
      <SeasonAtmosphere />
      <Petals />
      <Header />
      <main>
        <Cinematic />
        <SamuraiDivider variant="katana-reveal" />
        <Reveal><Explore /></Reveal>
        <Reveal><Featured /></Reveal>
        <PathOfSamurai />
        <Reveal><Destinations /></Reveal>
        <SamuraiDivider variant="kamon" />
        <Bushido />
        <Reveal><Collections /></Reveal>
        <Reveal><Compare /></Reveal>
        <SamuraiDivider variant="katana" tone="bg-charcoal" />
        <Reveal><Planner /></Reveal>
        <Reveal><DesignStudio /></Reveal>
        <Reveal><About /></Reveal>
      </main>
      <Footer />
      <DetailHost />
      <Toast />
    </AppState>
  );
}
