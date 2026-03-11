import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const venueType = searchParams.get("type");

  const where: Record<string, unknown> = { status: "approved" };
  if (city) where.city = city;
  if (venueType) where.venueType = venueType;

  const venues = await prisma.venue.findMany({
    where,
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(
    venues.map((v) => parseVenue(v as unknown as Record<string, unknown>))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check for duplicate slug
    const existing = await prisma.venue.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const venue = await prisma.venue.create({
      data: {
        name: body.name,
        slug: finalSlug,
        city: body.city,
        address: body.address,
        description: body.description || "",
        shortDescription: body.shortDescription || null,
        capacity: body.capacity || 0,
        pricePerDay: body.pricePerDay || 0,
        pricePerHalfDay: body.pricePerHalfDay || 0,
        amenities: JSON.stringify(body.amenities || []),
        images: JSON.stringify(body.images || []),
        venueType: body.venueType || "meeting_room",
        rating: 0,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        facilities: body.facilities ? JSON.stringify(body.facilities) : null,
        roomLayouts: body.roomLayouts ? JSON.stringify(body.roomLayouts) : null,
        transportInfo: body.transportInfo || null,
        parkingInfo: body.parkingInfo || null,
        termsAndConditions: body.termsAndConditions || null,
        sustainabilityInfo: body.sustainabilityInfo || null,
        meetingExpertName: body.meetingExpertName || null,
        meetingExpertRole: body.meetingExpertRole || null,
        meetingExpertImage: body.meetingExpertImage || null,
        phoneNumber: body.phoneNumber || null,
        email: body.email || null,
        status: "approved", // Auto-approve for demo
        isAiGenerated: body.isAiGenerated || false,
      },
    });

    return NextResponse.json(
      { id: venue.id, slug: venue.slug },
      { status: 201 }
    );
  } catch (error) {
    console.error("Venue creation error:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
