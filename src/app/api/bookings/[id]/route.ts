import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...booking,
    eventDate: booking.eventDate.toISOString(),
    endDate: booking.endDate?.toISOString() || null,
    createdAt: booking.createdAt.toISOString(),
    addOns: booking.addOns ? JSON.parse(booking.addOns) : null,
    venue: {
      ...booking.venue,
      amenities: JSON.parse(booking.venue.amenities),
      images: JSON.parse(booking.venue.images),
    },
  });
}
