// Single source of truth for the cinematic timeline.
// Boundaries calibrated against the supplied 10s video (240 frames @ 24fps):
//  0-2s mansion at the shore, 2-3s dragon in clouds, 3-5s dragon over burning house,
//  5-8s interior blade, then flight over misty kingdom, 8-10s dragon on cliff before moon.
export const VIDEO_DURATION_FALLBACK = 10;
export interface Chapter {
  id: string; index: number; name: string; label: string; headline: string; text: string;
  start: number; end: number; // scroll progress 0..1 (also equals video time / duration)
  warm?: boolean; pillars?: { title: string; text: string }[]; cta?: { label: string; href: string };
}
export const chapters: Chapter[] = [
  { id: 'sanctuary', index: 1, name: 'The Sanctuary', label: 'Sanctuary', headline: 'Find your next perspective.',
    text: 'AETHER connects remarkable spaces, meaningful destinations and the plans that bring them to life.', start: 0, end: 0.2,
    cta: { label: 'Explore the World', href: '#explore' } },
  { id: 'awakening', index: 2, name: 'The Awakening', label: 'Awakening', headline: 'Discover what lies beyond.',
    text: 'Exceptional spaces begin with a different perspective.', start: 0.2, end: 0.3,
    pillars: [{ title: 'Discover', text: 'Spaces and places' }, { title: 'Experience', text: 'Journeys worth taking' }, { title: 'Create', text: 'Ideas made real' }] },
  { id: 'inferno', index: 3, name: 'The Inferno', label: 'Inferno', headline: 'Imagination meets possibility.',
    text: 'The boldest ideas start as something that does not yet exist.', start: 0.3, end: 0.5, warm: true },
  { id: 'kingdom', index: 4, name: 'The Forgotten Kingdom', label: 'Kingdom', headline: 'Your next discovery starts here.',
    text: 'Three ways in, one connected place to keep what you find.', start: 0.5, end: 0.8,
    pillars: [{ title: 'Exceptional spaces', text: 'Homes and retreats' }, { title: 'Memorable destinations', text: 'Places to go' }, { title: 'Architecture and design', text: 'Ideas to collect' }] },
  { id: 'reveal', index: 5, name: 'The Final Reveal', label: 'Reveal', headline: 'Turn inspiration into action.',
    text: 'Save it, compare it, plan it, design it.', start: 0.8, end: 1, cta: { label: 'Start Exploring', href: '#explore' } },
];
export const chapterAt = (p: number) => chapters.find((c) => p >= c.start && p < c.end) ?? chapters[chapters.length - 1];
