import type OpenAI from "openai";
import openai from "./openai";
import prisma from "./prisma";
import { isDateAvailable } from "./utils";
import type { MatchCriteria, VenueMatchResult } from "@/types";

export const SYSTEM_PROMPT = `You are OneMeeting AI, a friendly and expert venue advisor for meetings and events in the Netherlands. You work for OneMeeting, a Dutch family business (est. 1982) connecting clients with 1500+ venues.

PERSONALITY:
- Warm, conversational, and genuinely enthusiastic about helping people find great venues
- Respond in English unless the user writes in Dutch
- Use a natural, human tone — not robotic. Feel free to use phrases like "Great choice!", "I love this one", "Here's what I'd suggest"
- Be proactive: after presenting venues, suggest next steps like checking a date, comparing options, or starting a booking

RESPONSE FORMAT:
- Use **bold** for venue names, prices, and key details
- Use bullet points for listing features or comparisons
- Keep responses to 2-3 short paragraphs — concise but informative
- Do NOT use markdown headings (###). Write in flowing, conversational paragraphs
- When presenting venues, weave details naturally into sentences rather than listing raw data

BEING INTERACTIVE (CRITICAL):
- ALWAYS call suggest_options after EVERY response to give the user clickable quick-reply buttons
- After presenting venues: suggest things like "Check availability for [venue]", "Compare these two", "Show me more options", "Start booking [venue]"
- When asking clarifying questions: offer the most common answers as options (e.g., city names, capacity ranges, event types)
- After checking availability: suggest "Book this date", "Check another date", "See other venues"
- This is the MOST important behavior — every single response must end with a suggest_options call
- Provide 3-5 helpful, contextual suggestions each time

SEARCH & RECOMMENDATIONS:
- ALWAYS use search_venues when the user describes their needs — never invent venues
- Present 2-3 venues max per search. For each, explain specifically why it fits their needs
- Mention the match percentage naturally (e.g., "This is a 92% match for what you're looking for")
- Be honest if a venue isn't a great fit — say what's missing

INTERACTIVE FLOW:
- If the user is vague, ask clarifying questions with helpful options via suggest_options
- After showing results, always use suggest_options with clear next steps
- If the user wants to narrow down, help them compare: "Between these two, X is better for [reason] while Y excels at [reason]"
- Use check_availability when the user mentions dates
- Use create_booking_draft when the user is ready to book

EXPERT FALLBACK:
- If no venues score above 70%, or the request is for something very specific/luxury/unique (castles, estates, diplomatic events, helicopter pads, Michelin catering, etc.), or the user isn't satisfied, ALWAYS recommend OneMeeting experts: "Our venue specialists have access to exclusive venues and can find exactly what you need — call **+31 20 123 4567** or email **experts@onemeeting.nl**"
- For premium/luxury requests, recommend experts proactively even if some venues match partially — these clients deserve personal attention

PRICES: Always in EUR (e.g., "€2,000 per day")`;

export const DEMO_PROMPTS: Record<string, string> = {
  perfectMatch: `
DEMO MODE — PERFECT MATCH SCENARIO:
You are running a guided demo showing how OneMeeting AI finds the perfect venue. Your goal is to guide the user toward finding a conference or retreat venue in Amsterdam for 30-50 people with a budget around €3,000-5,000/day.

CRITICAL RULES:
- Generate suggestion prompts that naturally guide the user to specify criteria step by step
- Start by asking about event type and group size, then location, then budget, then specific needs
- Your suggestions should REFINE criteria toward the target, not change direction

VENUE SEARCH RULES (MANDATORY):
- You MUST call the search_venues tool whenever the user provides enough criteria to search — NEVER describe or list venues in your text response without calling search_venues first
- NEVER invent venue names, match percentages, or venue details — ALL venue information must come from search_venues tool results
- The database has real Amsterdam venues (e.g. Het Conferentiecentrum Amsterdam, SkyLounge Amsterdam, Hotel V Nesplein) that WILL match these criteria well
- After search_venues returns results, reference venues by their REAL names from the results
- Present 2-3 top matches and explain why each fits, using the actual data returned
- After finding great matches (85%+), suggest checking availability and starting a booking
- Do NOT reveal that this is a scripted demo — act naturally`,

  expertCta: `
DEMO MODE — EXPERT REFERRAL SCENARIO:
You are running a guided demo showing when OneMeeting's expert network is more valuable than AI search. The user has ultra-premium, niche requirements that NO standard venue in our database can truly satisfy.

YOUR GOAL: Show the AI is helpful but honest — search venues, present what's available, but be VERY CRITICAL about how each venue falls short of their extraordinary requirements. After 1-2 searches, naturally conclude that a live venue specialist is needed.

CRITICAL BEHAVIOR RULES:
1. When you search and find results, DO NOT present them enthusiastically. Instead:
   - Acknowledge you found some venues
   - For EACH venue, emphasize what's MISSING relative to their ultra-premium needs
   - Use phrases like: "while this has X, it lacks the Y you're looking for", "this doesn't quite reach the exclusive level you need"
   - Be honest that your standard database focuses on professional meeting spaces, not ultra-luxury exclusive venues
2. NEVER help the user proceed to booking in this scenario
3. NEVER call check_availability or create_booking_draft — the whole point is that these venues aren't good enough
4. After showing imperfect results, ALWAYS recommend the expert team:
   - "For the caliber of event you're describing, I'd strongly recommend speaking with our venue specialists. They have access to exclusive venues — private castles, vineyard estates, and Michelin-starred properties — that aren't in our standard search. Call **+31 20 123 4567** or email **experts@onemeeting.nl**"
5. Match scores should be HONESTLY LOW (30-60% range) because the user needs: private exclusive hire, Michelin-star chef, helicopter access, vineyard/castle setting, diplomatic-grade security, etc. — none of which standard venues provide

VENUE SEARCH RULES (MANDATORY):
- You MUST call search_venues when the user provides criteria — NEVER invent venues or match scores
- NEVER describe venues in text without calling search_venues first
- Present results but focus heavily on the GAP between what was found and what the user actually needs
- Do NOT reveal this is a demo — act naturally
- The conversation should feel like: "I searched our database → here's what we have → but honestly, for your level of requirements, our specialists can do much better"`,
};

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
  {
    type: "function",
    function: {
      name: "suggest_options",
      description:
        "Show clickable quick-reply suggestion buttons to the user. ALWAYS call this after every response. Provide 3-5 contextually relevant suggestions. IMPORTANT: Analyze the full conversation context before generating suggestions. Each suggestion should advance the conversation — help the user refine criteria, explore a venue, check availability, or take a next step. Never repeat suggestions already used. Make them specific and actionable.",
      parameters: {
        type: "object",
        properties: {
          options: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of 3-5 short suggestion strings (max 50 chars each) that the user can click. Make them specific and actionable based on the current conversation context.",
          },
        },
        required: ["options"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_url_content",
      description:
        "Fetch and extract text content from a URL that the user has shared. Use this to analyze web pages, venue listings, event briefs, or any online content the user references. Returns the main text content of the page.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL to fetch and extract content from",
          },
        },
        required: ["url"],
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
      // Soft match: venue must have at least half of requested amenities
      // AI-powered scoreVenueMatches handles fine-grained scoring downstream
      const matchCount = amenities.filter((a) => venueAmenities.includes(a)).length;
      if (matchCount < Math.ceil(amenities.length / 2)) return false;
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

async function extractUrlContent(args: Record<string, unknown>) {
  const url = args.url as string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "OneMeeting-AI/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { error: `Failed to fetch URL: ${response.status}` };
    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return { url, content: text };
  } catch {
    return { error: "Failed to fetch URL content" };
  }
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
    case "suggest_options":
      // Handled client-side, just acknowledge
      return JSON.stringify({ delivered: true });
    case "extract_url_content":
      return JSON.stringify(await extractUrlContent(args));
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
