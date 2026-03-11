"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Phone,
  Train,
  Car,
  Leaf,
  UserCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import AvailabilityCalendar from "./AvailabilityCalendar";
import type { Venue } from "@/types";

export default function VenueSidebar({ venue }: { venue: Venue }) {
  const [selectedDate, setSelectedDate] = useState<string>("");

  const bookingUrl = selectedDate
    ? `/venues/${venue.slug}/book?date=${selectedDate}`
    : `/venues/${venue.slug}/book`;

  return (
    <div className="space-y-5">
      {/* Pricing + booking card */}
      <div className="glass-card p-6 sticky top-24">
        <div className="mb-4">
          <div className="text-2xl font-bold text-white mb-1">
            {formatPrice(venue.pricePerDay)}
            <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}> /day</span>
          </div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Half day from {formatPrice(venue.pricePerHalfDay)}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mb-4">
          <h3 className="text-sm font-medium text-white mb-3">Availability</h3>
          <AvailabilityCalendar
            slug={venue.slug}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        <Link
          href={bookingUrl}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-om-orange text-white font-medium hover:bg-om-orange-dark transition-colors"
        >
          Book This Venue
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href={`/?venue=${venue.slug}`}
          className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl glass-pill-orange text-sm font-medium"
        >
          Ask AI About This Venue
        </Link>

        {venue.phoneNumber && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <a
              href={`tel:${venue.phoneNumber.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 text-om-orange font-semibold text-sm hover:underline"
            >
              <Phone className="h-4 w-4" />
              Call {venue.phoneNumber}
            </a>
          </div>
        )}
      </div>

      {/* Rating card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-om-orange/15 flex items-center justify-center">
            <span className="text-xl font-bold text-om-orange">{venue.rating.toFixed(1)}</span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(venue.rating)
                      ? "fill-om-orange text-om-orange"
                      : "text-white/20"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              MeetingReview Score
            </p>
          </div>
        </div>
      </div>

      {/* Transport info */}
      {venue.transportInfo && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Train className="h-4 w-4 text-om-orange" />
            Directions & Public Transport
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {venue.transportInfo}
          </p>
        </div>
      )}

      {/* Parking info */}
      {venue.parkingInfo && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Car className="h-4 w-4 text-om-orange" />
            Parking
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {venue.parkingInfo}
          </p>
        </div>
      )}

      {/* Meeting Expert */}
      {venue.meetingExpertName && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Your Meeting Expert</h3>
          <div className="flex items-center gap-3">
            {venue.meetingExpertImage ? (
              <img
                src={venue.meetingExpertImage}
                alt={venue.meetingExpertName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <UserCircle className="w-12 h-12 text-white/30" />
            )}
            <div>
              <p className="text-sm font-medium text-white">{venue.meetingExpertName}</p>
              {venue.meetingExpertRole && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {venue.meetingExpertRole}
                </p>
              )}
            </div>
          </div>
          {venue.phoneNumber && (
            <a
              href={`tel:${venue.phoneNumber.replace(/\s/g, "")}`}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-om-orange/10 border border-om-orange/20 text-om-orange text-xs font-medium hover:bg-om-orange/20 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call {venue.phoneNumber}
            </a>
          )}
        </div>
      )}

      {/* Sustainability */}
      {venue.sustainabilityInfo && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-400" />
            Sustainability
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {venue.sustainabilityInfo}
          </p>
        </div>
      )}
    </div>
  );
}
