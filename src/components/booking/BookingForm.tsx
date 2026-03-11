"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, Mail, Phone, User, FileText, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import AddOnSelector from "./AddOnSelector";
import PriceCalculator from "./PriceCalculator";
import { addOns } from "./AddOnSelector";
import type { Venue } from "@/types";

const eventTypes = [
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "meeting", label: "Meeting" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social Event" },
  { value: "other", label: "Other" },
];

const addOnSuggestions: Record<string, string[]> = {
  workshop: ["catering", "breakout_rooms"],
  conference: ["catering", "av_equipment", "video_conferencing"],
  meeting: ["video_conferencing"],
  training: ["av_equipment", "catering"],
  social: ["catering"],
};

interface BookingFormProps {
  venue: Venue;
  initialDate?: string;
  initialAttendees?: number;
  initialAddOns?: string[];
}

export default function BookingForm({
  venue,
  initialDate,
  initialAttendees,
  initialAddOns,
}: BookingFormProps) {
  const router = useRouter();

  const [date, setDate] = useState(initialDate || "");
  const [endDate, setEndDate] = useState("");
  const [attendees, setAttendees] = useState(initialAttendees || 10);
  const [eventType, setEventType] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize addOns from URL params
  const initialAddOnMap: Record<string, boolean> = {};
  if (initialAddOns) {
    for (const a of initialAddOns) {
      initialAddOnMap[a] = true;
    }
  }
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>(initialAddOnMap);

  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<string[]>([]);

  const handleEventTypeChange = (type: string) => {
    setEventType(type);
    const sug = addOnSuggestions[type];
    if (sug && sug.length > 0) {
      setSuggestion(sug);
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
    }
  };

  const applySuggestion = () => {
    const updated = { ...selectedAddOns };
    for (const s of suggestion) {
      updated[s] = true;
    }
    setSelectedAddOns(updated);
    setShowSuggestion(false);
  };

  // Calculate total
  const basePrice = venue.pricePerDay;
  let addOnTotal = 0;
  for (const addon of addOns) {
    if (!selectedAddOns[addon.id]) continue;
    if (addon.id === "catering") addOnTotal += addon.price * attendees;
    else if (addon.id === "parking") addOnTotal += addon.price * Math.ceil(attendees / 2);
    else addOnTotal += addon.price;
  }
  const totalPrice = basePrice + addOnTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !contactName || !contactEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venue.id,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          eventDate: date,
          endDate: endDate || undefined,
          attendeeCount: attendees,
          eventType: eventType || undefined,
          addOns: selectedAddOns,
          specialRequests: specialRequests || undefined,
          totalPrice,
        }),
      });

      if (!res.ok) throw new Error("Booking failed");

      const { id } = await res.json();
      toast.success("Booking request submitted!");
      router.push(`/bookings/${id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Event Details */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-om-orange" />
          Event Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Event Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Number of Attendees *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="number"
                min={1}
                max={venue.capacity}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Max capacity: {venue.capacity}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => handleEventTypeChange(e.target.value)}
              className="glass-select w-full px-4 py-2.5 text-sm"
            >
              <option value="">Select type...</option>
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI suggestion */}
        {showSuggestion && (
          <div className="mt-4 p-3 rounded-xl bg-om-orange/10 border border-om-orange/20 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-om-orange mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-white">
                For {eventType}s, we recommend adding:{" "}
                {suggestion.map((s) => s.replace(/_/g, " ")).join(", ")}
              </p>
              <button
                type="button"
                onClick={applySuggestion}
                className="text-xs text-om-orange font-medium mt-1 hover:underline"
              >
                Add recommended add-ons
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Mail className="h-5 w-5 text-om-orange" />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-white mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@company.com"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Phone (optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+31 6 12345678"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add-Ons */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Add-Ons</h2>
        <AddOnSelector selected={selectedAddOns} onChange={setSelectedAddOns} />
      </div>

      {/* Special Requests */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-om-orange" />
          Special Requests
        </h2>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requirements, dietary needs, room layout preferences..."
          rows={3}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
        />
      </div>

      {/* Price & Submit */}
      <div className="space-y-4">
        <PriceCalculator
          basePrice={basePrice}
          selectedAddOns={selectedAddOns}
          attendees={attendees}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark disabled:opacity-50 transition-colors text-base"
        >
          {submitting ? "Submitting..." : "Request Booking"}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          OneMeeting will confirm your booking within 24 hours.
        </p>
      </div>
    </form>
  );
}
