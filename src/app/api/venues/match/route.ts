import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreVenueMatches } from "@/lib/venue-tools";
import type { MatchCriteria } from "@/types";

export async function POST(request: Request) {
  try {
    const { criteria, venueIds } = (await request.json()) as {
      criteria: MatchCriteria;
      venueIds?: string[];
    };

    if (!criteria || Object.keys(criteria).length === 0) {
      return NextResponse.json(
        { error: "Criteria is required" },
        { status: 400 }
      );
    }

    // Fetch venues - either specific ones or all approved
    const where: Record<string, unknown> = { status: "approved" };
    if (venueIds && venueIds.length > 0) {
      where.id = { in: venueIds };
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { rating: "desc" },
    });

    // Pre-filter by hard criteria before sending to AI
    const preFiltered = venues.filter((v) => {
      // Multi-city: venue must match at least one selected city
      if (criteria.cities && criteria.cities.length > 0) {
        const matchesCity = criteria.cities.some(
          (c) => c.toLowerCase() === v.city.toLowerCase()
        );
        if (!matchesCity) return false;
      }
      if (criteria.capacity && v.capacity < criteria.capacity) return false;
      if (criteria.budget && v.pricePerDay > criteria.budget) return false;
      // Multi venue type: venue must match at least one selected type
      if (criteria.venueTypes && criteria.venueTypes.length > 0) {
        if (!criteria.venueTypes.includes(v.venueType)) return false;
      }
      return true;
    });

    // Also include some that partially match (different city/over budget) for variety
    const softMatches = venues
      .filter((v) => !preFiltered.includes(v))
      .slice(0, 3);

    const toScore = [...preFiltered.slice(0, 10), ...softMatches].map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      city: v.city,
      capacity: v.capacity,
      pricePerDay: v.pricePerDay,
      venueType: v.venueType,
      amenities: JSON.parse(v.amenities) as string[],
      rating: v.rating,
      description: v.description,
      roomLayouts: v.roomLayouts,
    }));

    const scores = await scoreVenueMatches(criteria, toScore);

    // Sort by match percentage descending
    scores.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Collect IDs of all scored venues so frontend can split matched vs ruled-out
    const scoredVenueIds = toScore.map((v) => v.id);

    return NextResponse.json({ scores, scoredVenueIds });
  } catch (error) {
    console.error("Match scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score venues" },
      { status: 500 }
    );
  }
}
