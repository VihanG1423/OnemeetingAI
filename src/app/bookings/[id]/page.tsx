import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, MapPin, CalendarDays, Users, Printer, Building2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatPrice, formatDate, generateBookingRef } from "@/lib/utils";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!booking) notFound();

  const venue = booking.venue;
  const addOns: Record<string, boolean> = booking.addOns
    ? JSON.parse(booking.addOns)
    : {};
  const activeAddOns = Object.entries(addOns)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, " "));
  const ref = generateBookingRef();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="glass-card p-8 text-center animate-fade-in-up">
        {/* Success icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-om-orange/15 border border-om-orange/25 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-om-orange" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Booking Request Received!
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          OneMeeting will confirm your booking within 24 hours. You&apos;ll receive a
          confirmation email at{" "}
          <span className="text-white font-medium">{booking.contactEmail}</span>.
        </p>

        {/* Booking details card */}
        <div className="glass-card-light p-6 text-left mb-6">
          {/* Venue header */}
          <div className="flex items-start gap-4 mb-5">
            {venue.images && (
              <Image
                src={(JSON.parse(venue.images) as string[])[0]}
                alt={venue.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
            )}
            <div>
              <h2 className="text-base font-semibold text-white">{venue.name}</h2>
              <p className="text-sm flex items-center gap-1 mt-1" style={{ color: "var(--text-secondary)" }}>
                <MapPin className="h-3.5 w-3.5" />
                {venue.city}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <CalendarDays className="h-4 w-4" />
                Date
              </span>
              <span className="text-white font-medium">
                {formatDate(booking.eventDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Users className="h-4 w-4" />
                Attendees
              </span>
              <span className="text-white font-medium">
                {booking.attendeeCount}
              </span>
            </div>
            {booking.eventType && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Event Type</span>
                <span className="text-white font-medium capitalize">
                  {booking.eventType}
                </span>
              </div>
            )}
            {activeAddOns.length > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Add-Ons</span>
                <span className="text-white font-medium text-right capitalize">
                  {activeAddOns.join(", ")}
                </span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-om-orange">
                {formatPrice(booking.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="glass-badge-orange text-sm px-4 py-2 mb-6 inline-flex">
          Booking Ref: {ref}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="glass-pill px-5 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <Printer className="h-4 w-4" />
            Print Summary
          </button>
          <Link
            href="/venues"
            className="glass-pill-orange px-5 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Browse More Venues
          </Link>
        </div>
      </div>
    </div>
  );
}
