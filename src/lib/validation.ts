import type { Collection, DesignProject, ItemRef, Trip } from '@/types';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isRef = (v: unknown): v is ItemRef => isObj(v) && (v.kind === 'property' || v.kind === 'destination' || v.kind === 'reference') && isStr(v.id);

export const isCollections = (v: unknown): v is Collection[] =>
  Array.isArray(v) && v.every((c) => isObj(c) && isStr(c.id) && isStr(c.name) && isStr(c.createdAt) && isObj(c.notes) && Array.isArray(c.items) && c.items.every(isRef));
export const isTrips = (v: unknown): v is Trip[] =>
  Array.isArray(v) && v.every((t) => isObj(t) && isStr(t.id) && isStr(t.name) && isStr(t.destination) && isStr(t.startDate) && isStr(t.endDate) && isNum(t.budget) && isStr(t.notes) &&
    Array.isArray(t.items) && t.items.every((i) => isObj(i) && isStr(i.id) && isNum(i.day) && isStr(i.title) && isStr(i.notes) && isNum(i.cost) && typeof i.done === 'boolean'));
export const isProjects = (v: unknown): v is DesignProject[] =>
  Array.isArray(v) && v.every((p) => isObj(p) && isStr(p.id) && isStr(p.name) && isStr(p.projectType) && isStr(p.notes) && Array.isArray(p.references) && Array.isArray(p.palette) && p.palette.every(isStr) &&
    Array.isArray(p.materials) && Array.isArray(p.dimensions) && Array.isArray(p.tasks));
export const isCompare = (v: unknown): v is { kind: 'property' | 'destination'; ids: string[] } =>
  isObj(v) && (v.kind === 'property' || v.kind === 'destination') && Array.isArray(v.ids) && v.ids.every(isStr);

/** Trip date validation. Returns an error message or null. */
export function validateTripDates(start: string, end: string): string | null {
  if (!start || !end) return 'Choose both a start and an end date.';
  const s = Date.parse(start), e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 'Enter valid dates.';
  if (e < s) return 'The end date must be on or after the start date.';
  if ((e - s) / 86400000 > 365) return 'Trips are limited to 366 days.';
  return null;
}
export const tripDays = (start: string, end: string) => Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
