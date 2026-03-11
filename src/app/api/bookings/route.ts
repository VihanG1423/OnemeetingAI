import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      venueId,
      contactName,
      contactEmail,
      contactPhone,
      eventDate,
      endDate,
      attendeeCount,
      eventType,
      addOns,
      specialRequests,
      totalPrice,
    } = body;

    if (!venueId || !contactName || !contactEmail || !eventDate || !attendeeCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        venueId,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        attendeeCount,
        eventType: eventType || null,
        addOns: addOns ? JSON.stringify(addOns) : null,
        specialRequests: specialRequests || null,
        totalPrice: totalPrice || 0,
        status: "pending",
        // Enhanced fields
        companyName: body.companyName || null,
        ccEmail: body.ccEmail || null,
        onsiteContactPerson: body.onsiteContactPerson || null,
        invoiceReference: body.invoiceReference || null,
        timeFrom: body.timeFrom || null,
        timeTo: body.timeTo || null,
        isMultiDay: body.isMultiDay || false,
        meetingType: body.meetingType || null,
        roomLayout: body.roomLayout || null,
        programDescription: body.programDescription || null,
        cateringOptions: body.cateringOptions || null,
        avResources: body.avResources || null,
        needsHotelRooms: body.needsHotelRooms || false,
        hotelRoomDetails: body.hotelRoomDetails || null,
        climateNeutral: body.climateNeutral || false,
      },
    });

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
