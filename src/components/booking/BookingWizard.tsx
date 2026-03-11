"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import ComposeMeeting from "./steps/ComposeMeeting";
import YourData from "./steps/YourData";
import Confirmation from "./steps/Confirmation";
import type { Venue } from "@/types";

export interface BookingFormData {
  // Step 1 - Compose Meeting
  date: string;
  endDate: string;
  timeFrom: string;
  timeTo: string;
  isMultiDay: boolean;
  meetingType: string;
  attendees: number;
  roomLayout: string;
  needsSubRooms: boolean;
  programDescription: string;
  catering: { breakfast: boolean; lunch: boolean; drinks: boolean; dinner: boolean };
  avResources: { projector: boolean; flip_chart: boolean; microphone: boolean; sound_system: boolean };
  needsHotelRooms: boolean;
  hotelRoomDetails: string;
  specialRequests: string;

  // Step 2 - Your Data
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  ccEmail: string;
  onsiteContactPerson: string;
  invoiceReference: string;
  climateNeutral: boolean;
}

const initialFormData: BookingFormData = {
  date: "",
  endDate: "",
  timeFrom: "09:00",
  timeTo: "17:00",
  isMultiDay: false,
  meetingType: "",
  attendees: 10,
  roomLayout: "",
  needsSubRooms: false,
  programDescription: "",
  catering: { breakfast: false, lunch: false, drinks: false, dinner: false },
  avResources: { projector: false, flip_chart: false, microphone: false, sound_system: false },
  needsHotelRooms: false,
  hotelRoomDetails: "",
  specialRequests: "",
  companyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  ccEmail: "",
  onsiteContactPerson: "",
  invoiceReference: "",
  climateNeutral: false,
};

const steps = [
  { num: 1, label: "Compose meeting" },
  { num: 2, label: "Your data" },
  { num: 3, label: "Done thanks" },
];

interface BookingWizardProps {
  venue: Venue;
  initialDate?: string;
  initialAttendees?: number;
}

export default function BookingWizard({ venue, initialDate, initialAttendees }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    ...initialFormData,
    date: initialDate || "",
    attendees: initialAttendees || 10,
  });

  const updateForm = (partial: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const goNext = () => {
    if (step === 1) {
      if (!formData.date) {
        toast.error("Please select a date");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.contactName || !formData.contactEmail) {
        toast.error("Please fill in your name and email");
        return;
      }
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: venue.id,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone || undefined,
          eventDate: formData.date,
          endDate: formData.isMultiDay && formData.endDate ? formData.endDate : undefined,
          attendeeCount: formData.attendees,
          eventType: formData.meetingType || undefined,
          specialRequests: formData.specialRequests || undefined,
          totalPrice: venue.pricePerDay, // Simplified for now
          companyName: formData.companyName || undefined,
          ccEmail: formData.ccEmail || undefined,
          onsiteContactPerson: formData.onsiteContactPerson || undefined,
          invoiceReference: formData.invoiceReference || undefined,
          timeFrom: formData.timeFrom || undefined,
          timeTo: formData.timeTo || undefined,
          isMultiDay: formData.isMultiDay,
          meetingType: formData.meetingType || undefined,
          roomLayout: formData.roomLayout || undefined,
          programDescription: formData.programDescription || undefined,
          cateringOptions: JSON.stringify(formData.catering),
          avResources: JSON.stringify(formData.avResources),
          needsHotelRooms: formData.needsHotelRooms,
          hotelRoomDetails: formData.hotelRoomDetails || undefined,
          climateNeutral: formData.climateNeutral,
        }),
      });

      if (!res.ok) throw new Error("Booking failed");

      const { id } = await res.json();
      setBookingId(id);
      setStep(3);
      toast.success("Booking request submitted!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    step > s.num
                      ? "bg-om-orange text-white"
                      : step === s.num
                      ? "bg-om-orange/20 border-2 border-om-orange text-om-orange"
                      : "bg-white/5 border border-white/20 text-white/40"
                  )}
                >
                  {step > s.num ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    step >= s.num ? "text-white" : "text-white/40"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-12 sm:w-20 mx-2 sm:mx-4 rounded-full transition-colors",
                    step > s.num ? "bg-om-orange" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">
          {step === 1 ? "Compose meeting" : step === 2 ? "Your data" : "Done thanks!"}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {venue.name}
        </p>
      </div>

      {/* Step content */}
      {step === 1 && (
        <ComposeMeeting
          venue={venue}
          formData={formData}
          updateForm={updateForm}
        />
      )}
      {step === 2 && (
        <YourData formData={formData} updateForm={updateForm} />
      )}
      {step === 3 && (
        <Confirmation
          venue={venue}
          formData={formData}
          bookingId={bookingId}
        />
      )}

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : step === 2 ? "Send" : "Next step"}
            {!submitting && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
