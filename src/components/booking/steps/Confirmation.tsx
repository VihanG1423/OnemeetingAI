"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Venue } from "@/types";
import type { BookingFormData } from "../BookingWizard";

interface ConfirmationProps {
  venue: Venue;
  formData: BookingFormData;
  bookingId: string | null;
}

export default function Confirmation({ venue, formData, bookingId }: ConfirmationProps) {
  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Your booking request has been sent!
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          We will confirm your booking within 24 hours. You will receive an email at{" "}
          <span className="text-white font-medium">{formData.contactEmail}</span>
        </p>
        {bookingId && (
          <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-xs text-white/50">Booking Reference: </span>
            <span className="text-sm font-mono font-bold text-om-orange">
              {bookingId.slice(0, 12).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Booking summary */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Booking Summary</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="h-4 w-4 text-om-orange mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{venue.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{venue.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-om-orange shrink-0" />
            <p className="text-sm text-white">
              {formData.date ? formatDate(formData.date) : "—"}
              {formData.isMultiDay && formData.endDate && (
                <> to {formatDate(formData.endDate)}</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-om-orange shrink-0" />
            <p className="text-sm text-white">
              {formData.timeFrom} - {formData.timeTo}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-om-orange shrink-0" />
            <p className="text-sm text-white">{formData.attendees} persons</p>
          </div>

          {formData.meetingType && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shrink-0" />
              <p className="text-sm text-white/70">
                Type: {formData.meetingType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
            </div>
          )}

          {formData.companyName && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shrink-0" />
              <p className="text-sm text-white/70">Company: {formData.companyName}</p>
            </div>
          )}

          {formData.climateNeutral && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shrink-0" />
              <p className="text-sm text-green-400">Climate-neutral arrangement included</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/venues/${venue.slug}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-colors text-sm"
        >
          Back to Venue
        </Link>
        <Link
          href="/venues"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-om-orange text-white font-medium hover:bg-om-orange-dark transition-colors text-sm"
        >
          Browse More Venues
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
