import type OpenAI from "openai";
import openai from "./openai";
import prisma from "./prisma";
import { isDateAvailable } from "./utils";
import type { MatchCriteria, VenueMatchResult } from "@/types";

export const SYSTEM_PROMPT = `You are OneMeeting AI, a friendly and knowledgeable venue booking assistant for meetings and events in the Netherlands. You work for OneMeeting, a Dutch family business (est. 1982) that connects clients with 1500+ meeting and event venues.

Key behaviors:
- Always respond in English unless the user writes in Dutch, then respond in Dutch
- Be concise but warm and helpful. You are a professional venue advisor.
- When the user describes their needs, ALWAYS use the search_venues tool to find matching venues. Never make up venue names.
- Suggest 2-3 venues max per search. Highlight what makes each one a good fit.
- After showing results, ask if the user wants more details, to check availability on a specific date, or to start booking
- For booking, use create_booking_draft to generate a pre-filled booking link
- Mention prices in EUR (e.g., "€2,000 per day")
- Be enthusiastic about unique Dutch venues (canal boats, museums, historic estates)
- If the user is vague, ask ONE clarifying question about the most important missing detail: number of attendees, city, date, or event type
- Keep responses to 2-3 short paragraphs max
- Use the check_availability tool when the user asks about specific dates
- When showing venue results, mention the match percentage and the top highlights for each venue
- If no venues score above 70% match, or if the user isn't satisfied with recommendations, suggest they speak with a OneMeeting expert who can find the perfect venue. Say something like: "If none of these feel right, our venue experts can help find exactly what you need. Call +31 20 123 4567 or email experts@onemeeting.nl for personalized assistance."
- Always be honest about match quality - if a venue is only a 50% match, say so and explain what's missing`;

export const venueTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_venues",
      description:
        "Search for meeting venues in the Netherlands based on criteria like city, capacity, budget, and required amenities. Returns matching venues sorted by relevance.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description:
              "City name (Amsterdam, Rotterdam, Utrecht, The Hague, Eindhoven)",
          },
          minCapacity: {
            type: "number",
            description: "Minimum number of attendees the venue must accommodate",
          },
          maxBudget: {
            type: "number",
            description: "Maximum budget per day in EUR",
          },
          amenities: {
            type: "array",
            items: { type: "string" },
            description:
              "Required amenities (e.g., wifi, catering, projector, whiteboard, breakout_rooms, parking, accessibility, natural_light, outdoor_space, kitchen, av_equipment, video_conferencing)",
          },
          venueType: {
            type: "string",
            enum: [
              "conference_center",
              "meeting_room",
              "workshop_space",
              "unique_venue",
              "hotel",
              "coworking",
            ],
            description: "Type of venue",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_venue_details",
      description: "Get full details for a specific venue by its slug identifier.",
      parameters: {
        type: "object",
        properties: {
          venueSlug: {
            type: "string",
            description: "The URL slug of the venue",
          },
        },
        required: ["venueSlug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Check if a venue is available on a specific date. Returns availability status and alternative dates if not available.",
      parameters: {
        type: "object",
        properties: {
          venueSlug: {
            type: "string",
            description: "The URL slug of the venue",
          },
          date: {
            type: "string",
            description: "Date to check in YYYY-MM-DD format",
          },
        },
        required: ["venueSlug", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking_draft",
      description:
        "Create a pre-filled booking URL for a venue. Use this when the user is ready to book.",
      parameters: {
        type: "object",
        properties: {
          venueSlug: {
            type: "string",
            description: "The URL slug of the venue",
          },
          date: {
            type: "string",
            description: "Event date in YYYY-MM-DD format",
          },
          attendees: {
            type: "number",
            description: "Number of attendees",
          },
          addOns: {
            type: "array",
            items: { type: "string" },
            description:
              "Add-ons to pre-select (catering, av_equipment, video_conferencing, parking, breakout_rooms)",
          },
        },
        required: ["venueSlug", "date", "attendees"],
      },
    },
  },
];

// Tool execution functions

async function searchVenues(args: Record<string, unknown>) {
  const city = args.city as string | undefined;
  const minCapacity = args.minCapacity as number | undefined;
  const maxBudget = args.maxBudget as number | undefined;
  const amenities = args.amenities as string[] | undefined;
  const venueType = args.venueType as string | undefined;

  // Fetch all venues and filter in app layer (SQLite JSON limitations)
  const allVenues = await prisma.venue.findMany({ orderBy: { rating: "desc" } });

  const filtered = allVenues.filter((v) => {
    if (city && v.city.toLowerCase() !== city.toLowerCase()) return false;
    if (minCapacity && v.capacity < minCapacity) return false;
    if (maxBudget && v.pricePerDay > maxBudget) return false;
    if (venueType && v.venueType !== venueType) return false;
    if (amenities && amenities.length > 0) {
      const venueAmenities = JSON.parse(v.amenities) as string[];
      if (!amenities.every((a) => venueAmenities.includes(a))) return false;
    }
    return true;
  });

  return filtered.slice(0, 5).map((v) => ({
    name: v.name,
    slug: v.slug,
    city: v.city,
    capacity: v.capacity,
    pricePerDay: v.pricePerDay,
    venueType: v.venueType,
    rating: v.rating,
    amenities: JSON.parse(v.amenities) as string[],
    image: (JSON.parse(v.images) as string[])[0] || "",
  }));
}

async function getVenueDetails(args: Record<string, unknown>) {
  const slug = args.venueSlug as string;
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return { error: "Venue not found" };

  return {
    ...venue,
    amenities: JSON.parse(venue.amenities),
    images: JSON.parse(venue.images),
  };
}

async function checkAvailability(args: Record<string, unknown>) {
  const slug = args.venueSlug as string;
  const date = args.date as string;

  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return { error: "Venue not found" };

  const available = isDateAvailable(slug, date);

  if (!available) {
    // Suggest 3 nearby available dates
    const alternatives: string[] = [];
    const baseDate = new Date(date);
    for (let offset = 1; alternatives.length < 3 && offset <= 14; offset++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(checkDate.getDate() + offset);
      const checkStr = checkDate.toISOString().split("T")[0];
      if (isDateAvailable(slug, checkStr)) {
        alternatives.push(checkStr);
      }
    }
    return { available: false, venueSlug: slug, date, alternativeDates: alternatives };
  }

  return { available: true, venueSlug: slug, date };
}

async function createBookingDraft(args: Record<string, unknown>) {
  const slug = args.venueSlug as string;
  const date = args.date as string;
  const attendees = args.attendees as number;
  const addOns = (args.addOns as string[]) || [];

  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return { error: "Venue not found" };

  const params = new URLSearchParams();
  params.set("date", date);
  params.set("attendees", String(attendees));
  if (addOns.length > 0) params.set("addOns", addOns.join(","));

  return {
    bookingUrl: `/venues/${slug}/book?${params.toString()}`,
    estimatedPrice: venue.pricePerDay,
    venueName: venue.name,
  };
}

export async function executeVenueTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "search_venues":
      return JSON.stringify(await searchVenues(args));
    case "get_venue_details":
      return JSON.stringify(await getVenueDetails(args));
    case "check_availability":
      return JSON.stringify(await checkAvailability(args));
    case "create_booking_draft":
      return JSON.stringify(await createBookingDraft(args));
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

// AI-powered venue match scoring
export async function scoreVenueMatches(
  criteria: MatchCriteria,
  venues: Array<{
    id: string;
    name: string;
    slug: string;
    city: string;
    capacity: number;
    pricePerDay: number;
    venueType: string;
    amenities: string[];
    rating: number;
    description: string;
    roomLayouts: string | null;
  }>
): Promise<VenueMatchResult[]> {
  if (venues.length === 0) return [];

  const criteriaDesc = Object.entries(criteria)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  const venueDescriptions = venues
    .map(
      (v, i) =>
        `[${i}] ID: ${v.id} | "${v.name}" in ${v.city} | Capacity: ${v.capacity} | Price: €${v.pricePerDay}/day | Type: ${v.venueType} | Amenities: ${v.amenities.join(", ")} | Rating: ${v.rating} | ${v.description.slice(0, 200)}`
    )
    .join("\n");

  const prompt = `You are a venue matching expert. Score how well each venue matches the user's criteria.

USER CRITERIA:
${criteriaDesc}

VENUES:
${venueDescriptions}

For each venue, return a JSON array with objects containing:
- venueId: the venue ID
- matchPercentage: 0-100 score (100 = perfect match). Consider capacity fit, location, price, amenities, venue type, and overall suitability.
- topHighlights: exactly 3 short (max 10 words each) reasons this venue is a good fit for these specific criteria. Be specific, not generic.
- missingRequirements: short list of criteria the venue doesn't meet (empty array if all met)

Return ONLY valid JSON array, no markdown or explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : parsed.results || parsed.venues || [];
    return results.map((r: Record<string, unknown>) => ({
      venueId: r.venueId as string,
      matchPercentage: Math.round(r.matchPercentage as number),
      topHighlights: (r.topHighlights as string[]).slice(0, 3),
      missingRequirements: (r.missingRequirements as string[]) || [],
    }));
  } catch {
    return [];
  }
}
