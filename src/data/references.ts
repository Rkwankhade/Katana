import type { DesignReference } from '@/types';
export const referenceLibrary: DesignReference[] = [
  { id: 'r-exterior-1', title: 'Terrace facade', image: '/img/coastal-villa.svg', group: 'Exterior architecture' },
  { id: 'r-exterior-2', title: 'Cantilever roof', image: '/img/glass-residence.svg', group: 'Exterior architecture' },
  { id: 'r-exterior-3', title: 'Gabled cabin', image: '/img/mountain-retreat.svg', group: 'Exterior architecture' },
  { id: 'r-interior-1', title: 'Warm lounge', image: '/img/interior-lounge.svg', group: 'Interior spaces' },
  { id: 'r-interior-2', title: 'Stone kitchen', image: '/img/interior-kitchen.svg', group: 'Interior spaces' },
  { id: 'r-light-1', title: 'Lantern path', image: '/img/boutique-hotel.svg', group: 'Lighting' },
  { id: 'r-land-1', title: 'Courtyard planting', image: '/img/courtyard-house.svg', group: 'Landscaping' },
  { id: 'r-detail-1', title: 'Concrete tower detail', image: '/img/concrete-pavilion.svg', group: 'Details and finishes' },
];
export const refById = (id: string) => referenceLibrary.find((r) => r.id === id);
