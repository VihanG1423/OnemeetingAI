import type { Venue, FacilityCategory, RoomLayoutConfig } from "@/types";

/**
 * Parse raw Prisma venue record into typed Venue object.
 * Handles JSON string fields for amenities, images, facilities, roomLayouts.
 */
export function parseVenue(raw: Record<string, unknown>): Venue {
  return {
    ...(raw as unknown as Venue),
    amenities: safeJsonParse<string[]>(raw.amenities as string, []),
    images: safeJsonParse<string[]>(raw.images as string, []),
    facilities: raw.facilities
      ? safeJsonParse<FacilityCategory[] | null>(raw.facilities as string, null)
      : null,
    roomLayouts: raw.roomLayouts
      ? safeJsonParse<RoomLayoutConfig[] | null>(raw.roomLayouts as string, null)
      : null,
  };
}

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
