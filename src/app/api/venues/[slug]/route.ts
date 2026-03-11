import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const venue = await prisma.venue.findUnique({ where: { slug } });

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json(parseVenue(venue as unknown as Record<string, unknown>));
}
