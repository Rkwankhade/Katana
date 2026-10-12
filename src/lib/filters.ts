import type { Property } from '@/types';
export interface Filters { q: string; category: string; region: string; style: string; amenity: string; minPrice: string; maxPrice: string; minArea: string; maxArea: string; sort: string }
export const emptyFilters: Filters = { q: '', category: '', region: '', style: '', amenity: '', minPrice: '', maxPrice: '', minArea: '', maxArea: '', sort: 'featured' };

export function applyFilters(list: Property[], f: Filters): Property[] {
  const q = f.q.trim().toLowerCase();
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  const minP = num(f.minPrice), maxP = num(f.maxPrice), minA = num(f.minArea), maxA = num(f.maxArea);
  const out = list.filter((p) => {
    if (q && ![p.name, p.location, p.description, p.architecturalStyle, p.category, ...p.tags, ...p.amenities].join(' ').toLowerCase().includes(q)) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.region && p.region !== f.region) return false;
    if (f.style && p.architecturalStyle !== f.style) return false;
    if (f.amenity && !p.amenities.includes(f.amenity)) return false;
    if (minP !== null && (p.priceEstimate === null || p.priceEstimate < minP)) return false;
    if (maxP !== null && (p.priceEstimate === null || p.priceEstimate > maxP)) return false;
    if (minA !== null && (p.area === null || p.area < minA)) return false;
    if (maxA !== null && (p.area === null || p.area > maxA)) return false;
    return true;
  });
  const cmpNull = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? 1 : b === null ? -1 : (a - b) * dir);
  switch (f.sort) {
    case 'price-asc': return [...out].sort((a, b) => cmpNull(a.priceEstimate, b.priceEstimate, 1));
    case 'price-desc': return [...out].sort((a, b) => cmpNull(a.priceEstimate, b.priceEstimate, -1));
    case 'area-desc': return [...out].sort((a, b) => cmpNull(a.area, b.area, -1));
    case 'name': return [...out].sort((a, b) => a.name.localeCompare(b.name));
    default: return out;
  }
}
export const fmtMoney = (n: number | null, cur = 'USD') => (n === null ? 'Not provided' : new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n));
export const fmtArea = (n: number | null) => (n === null ? 'Not provided' : `${n.toLocaleString('en-US')} m²`);
