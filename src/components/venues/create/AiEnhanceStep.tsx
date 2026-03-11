"use client";

import { Sparkles, Building2, MapPin } from "lucide-react";
import type { VenueFormData } from "./VenueCreateWizard";

interface AiEnhanceStepProps {
  formData: VenueFormData;
  isGenerating: boolean;
}

export default function AiEnhanceStep({ formData, isGenerating }: AiEnhanceStepProps) {
  return (
    <div className="space-y-6">
      {/* Summary of what we're generating for */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-om-orange" />
          Venue Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/50">Name:</span>
            <p className="text-white font-medium">{formData.name}</p>
          </div>
          <div>
            <span className="text-white/50">City:</span>
            <p className="text-white font-medium">{formData.city}</p>
          </div>
          <div>
            <span className="text-white/50">Type:</span>
            <p className="text-white font-medium">{formData.venueType.replace(/_/g, " ")}</p>
          </div>
          <div>
            <span className="text-white/50">Capacity:</span>
            <p className="text-white font-medium">{formData.capacity} persons</p>
          </div>
          <div className="col-span-2">
            <span className="text-white/50">Address:</span>
            <p className="text-white font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formData.address}
            </p>
          </div>
        </div>
      </div>

      {/* AI generation status */}
      <div className="glass-card p-8 text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
          isGenerating ? "bg-om-orange/20 animate-pulse" : "bg-om-orange/10"
        }`}>
          <Sparkles className={`h-10 w-10 text-om-orange ${isGenerating ? "animate-spin" : ""}`} />
        </div>

        {isGenerating ? (
          <>
            <h2 className="text-xl font-bold text-white mb-3">AI is crafting your listing...</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              Our AI is generating a professional description, facilities list, room layouts,
              transport information, terms & conditions, and sustainability details for your venue.
            </p>
            <div className="mt-6 space-y-2 max-w-sm mx-auto">
              {[
                "Writing compelling description...",
                "Analyzing venue amenities...",
                "Generating room configurations...",
                "Adding transport & parking details...",
                "Creating terms & conditions...",
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="w-2 h-2 rounded-full bg-om-orange animate-pulse" />
                  <span className="text-xs text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-3">Ready to Generate</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              Click &quot;Generate with AI&quot; below to create a professional venue listing based on
              the information you provided. You&apos;ll be able to review and edit everything before publishing.
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-xs">
              {[
                "Description & tagline",
                "Facilities list",
                "Room layout capacities",
                "Transport directions",
                "Parking info",
                "Terms & conditions",
              ].map((item) => (
                <div
                  key={item}
                  className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/60"
                >
                  {item}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
