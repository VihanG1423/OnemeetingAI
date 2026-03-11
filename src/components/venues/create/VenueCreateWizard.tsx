"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import BasicInfoStep from "./BasicInfoStep";
import AiEnhanceStep from "./AiEnhanceStep";
import ReviewListingStep from "./ReviewListingStep";
import type { FacilityCategory, RoomLayoutConfig } from "@/types";

export interface VenueFormData {
  // Basic Info
  name: string;
  city: string;
  address: string;
  venueType: string;
  capacity: number;
  pricePerDay: number;
  pricePerHalfDay: number;
  images: string[];
  additionalDetails: string;
  phoneNumber: string;
  email: string;

  // AI-generated (editable)
  description: string;
  shortDescription: string;
  amenities: string[];
  facilities: FacilityCategory[];
  roomLayouts: RoomLayoutConfig[];
  transportInfo: string;
  parkingInfo: string;
  termsAndConditions: string;
  sustainabilityInfo: string;
}

const initialFormData: VenueFormData = {
  name: "",
  city: "",
  address: "",
  venueType: "meeting_room",
  capacity: 50,
  pricePerDay: 0,
  pricePerHalfDay: 0,
  images: [],
  additionalDetails: "",
  phoneNumber: "",
  email: "",
  description: "",
  shortDescription: "",
  amenities: [],
  facilities: [],
  roomLayouts: [],
  transportInfo: "",
  parkingInfo: "",
  termsAndConditions: "",
  sustainabilityInfo: "",
};

const steps = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "AI Enhance" },
  { num: 3, label: "Review & Publish" },
];

export default function VenueCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<VenueFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (partial: Partial<VenueFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const goToStep = (target: number) => {
    if (target === 2) {
      if (!formData.name || !formData.city || !formData.address) {
        toast.error("Please fill in venue name, city, and address");
        return;
      }
      setStep(2);
    } else {
      setStep(target);
    }
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      // Generate default images if none provided
      const images = formData.images.length > 0
        ? formData.images
        : [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
          ];

      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images,
          isAiGenerated: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to create venue");

      const { slug } = await res.json();
      toast.success("Venue listed successfully!");
      router.push(`/venues/${slug}`);
    } catch {
      toast.error("Failed to publish venue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          List Your Venue on OneMeeting
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Create a professional listing with AI-powered content generation
        </p>
      </div>

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

      {/* Step content */}
      {step === 1 && (
        <BasicInfoStep formData={formData} updateForm={updateForm} />
      )}
      {step === 2 && (
        <AiEnhanceStep formData={formData} updateForm={updateForm} />
      )}
      {step === 3 && (
        <ReviewListingStep formData={formData} updateForm={updateForm} />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
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

        {step === 1 && (
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark transition-colors"
          >
            Next: AI Enhance
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark transition-colors"
          >
            Continue to Review
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? "Publishing..." : "Publish Listing"}
          </button>
        )}
      </div>
    </div>
  );
}
