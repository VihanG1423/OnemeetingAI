"use client";

import { Check, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { VenueFormData } from "./VenueCreateWizard";

interface ReviewListingStepProps {
  formData: VenueFormData;
  updateForm: (partial: Partial<VenueFormData>) => void;
}

export default function ReviewListingStep({ formData, updateForm }: ReviewListingStepProps) {
  return (
    <div className="space-y-6">
      {/* Preview header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Listing Preview</h3>
          <span className="text-xs px-3 py-1 rounded-full bg-om-orange/15 text-om-orange font-medium">
            AI Generated
          </span>
        </div>

        {/* Venue header preview */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{formData.name}</h2>
          <p className="text-sm italic text-om-orange mt-1">{formData.shortDescription}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {formData.address} &middot; {formData.city}
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="text-white/60">
            From {formatPrice(formData.pricePerDay)}/day
          </span>
          <span className="text-white/60">
            Up to {formData.capacity} guests
          </span>
        </div>
      </div>

      {/* Editable description */}
      <EditableSection
        title="Description"
        value={formData.description}
        onChange={(val) => updateForm({ description: val })}
        multiline
      />

      {/* Short description */}
      <EditableSection
        title="Tagline"
        value={formData.shortDescription}
        onChange={(val) => updateForm({ shortDescription: val })}
      />

      {/* Facilities */}
      {formData.facilities.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Facilities</h3>
          <div className="space-y-4">
            {formData.facilities.map((cat, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-om-orange mb-2">{cat.category}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <Check className="h-3 w-3 text-om-orange shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Layouts */}
      {formData.roomLayouts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Room Layouts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-white/50">Room</th>
                  <th className="text-center py-2 px-1 text-white/50">Theater</th>
                  <th className="text-center py-2 px-1 text-white/50">Class</th>
                  <th className="text-center py-2 px-1 text-white/50">U-Shape</th>
                  <th className="text-center py-2 px-1 text-white/50">Board</th>
                  <th className="text-center py-2 px-1 text-white/50">Cabaret</th>
                  <th className="text-center py-2 px-1 text-white/50">Reception</th>
                </tr>
              </thead>
              <tbody>
                {formData.roomLayouts.map((layout, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 px-2 text-white font-medium">{layout.name}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.theater || "—"}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.classroom || "—"}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.uShape || "—"}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.boardroom || "—"}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.cabaret || "—"}</td>
                    <td className="text-center py-2 px-1 text-white/70">{layout.reception || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transport & Parking */}
      <EditableSection
        title="Transport & Directions"
        value={formData.transportInfo}
        onChange={(val) => updateForm({ transportInfo: val })}
        multiline
      />

      <EditableSection
        title="Parking"
        value={formData.parkingInfo}
        onChange={(val) => updateForm({ parkingInfo: val })}
        multiline
      />

      {/* Terms & Sustainability */}
      <EditableSection
        title="Terms & Conditions"
        value={formData.termsAndConditions}
        onChange={(val) => updateForm({ termsAndConditions: val })}
        multiline
      />

      <EditableSection
        title="Sustainability"
        value={formData.sustainabilityInfo}
        onChange={(val) => updateForm({ sustainabilityInfo: val })}
        multiline
      />
    </div>
  );
}

function EditableSection({
  title,
  value,
  onChange,
  multiline = false,
}: {
  title: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <Pencil className="h-3.5 w-3.5 text-white/30" />
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
