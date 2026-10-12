export type PropertyCategory = 'Coastal villas' | 'Mountain retreats' | 'Contemporary residences' | 'Boutique hospitality' | 'Architectural landmarks' | 'Interior design references';
export type DestinationCategory = 'Nature escapes' | 'Architecture and culture' | 'Scenic road trips' | 'Coastal experiences' | 'Mountain destinations' | 'Weekend retreats' | 'Samurai heritage';

export interface Hotspot { id: string; label: string; x: number; y: number; detail: string }
export interface Property {
  id: string; name: string; category: PropertyCategory; location: string; region: string; description: string;
  image: string; gallery: string[]; architecturalStyle: string; priceEstimate: number | null; currency: string;
  area: number | null; outdoorArea: number | null; rooms: string | null; amenities: string[]; tags: string[];
  sampleData: true; notes: string; hotspots: Hotspot[];
}
export interface Destination {
  id: string; name: string; region: string; category: DestinationCategory; description: string; image: string;
  estimatedDuration: string | null; durationDays: number | null; illustrativeBudget: number | null; currency: string;
  tags: string[]; sampleData: true; notes: string; experienceType: string;
}
export type ItemKind = 'property' | 'destination' | 'reference';
export interface ItemRef { kind: ItemKind; id: string }
export interface Collection { id: string; name: string; items: ItemRef[]; notes: Record<string, string>; createdAt: string }
export interface ItineraryItem { id: string; day: number; title: string; notes: string; cost: number; done: boolean; ref?: ItemRef }
export interface Trip { id: string; name: string; destination: string; startDate: string; endDate: string; items: ItineraryItem[]; budget: number; notes: string }
export interface DesignReference { id: string; title: string; image: string; group: string }
export interface Material { id: string; name: string; note: string }
export interface DesignTask { id: string; text: string; done: boolean }
export interface DesignProject {
  id: string; name: string; projectType: string; references: DesignReference[]; palette: string[]; materials: Material[];
  dimensions: { room: string; width: number; length: number; height: number }[]; tasks: DesignTask[]; notes: string;
}
