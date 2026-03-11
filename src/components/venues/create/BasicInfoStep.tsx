"use client";

import {
  Building2,
  MapPin,
  Users,
  Euro,
  Phone,
  Mail,
  Image as ImageIcon,
  FileText,
  Zap,
} from "lucide-react";
import NextImage from "next/image";
import type { VenueFormData } from "./VenueCreateWizard";

const venueTypes = [
  { value: "conference_center", label: "Conference Center" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "workshop_space", label: "Workshop Space" },
  { value: "unique_venue", label: "Unique Venue" },
  { value: "hotel", label: "Hotel" },
  { value: "coworking", label: "Coworking Space" },
];

const dutchCities = [
  "Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven",
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Haarlem", "Arnhem", "Maastricht", "Leiden", "Delft",
];

const demoVenues: Partial<VenueFormData>[] = [
  {
    name: "The Innovation Hub Amsterdam",
    city: "Amsterdam",
    address: "Keizersgracht 520, 1017 EK Amsterdam",
    venueType: "conference_center",
    capacity: 120,
    pricePerDay: 2500,
    pricePerHalfDay: 1500,
    phoneNumber: "020 - 555 1234",
    email: "events@innovationhub.nl",
    additionalDetails: "Modern conference center in a renovated canal house. Rooftop terrace with canal views, organic catering available, 3 breakout rooms, state-of-the-art AV. Near Vijzelstraat metro station.",
  },
  {
    name: "Het Vergaderpaleis Rotterdam",
    city: "Rotterdam",
    address: "Wilhelminakade 85, 3072 AP Rotterdam",
    venueType: "meeting_room",
    capacity: 50,
    pricePerDay: 1200,
    pricePerHalfDay: 750,
    phoneNumber: "010 - 555 5678",
    email: "info@vergaderpaleis.nl",
    additionalDetails: "Stylish meeting rooms overlooking the Erasmus Bridge. Full catering kitchen, natural light in all rooms, free parking for 20 cars, wheelchair accessible.",
  },
  {
    name: "De Oude Brouwerij Utrecht",
    city: "Utrecht",
    address: "Oudegracht 180, 3511 NL Utrecht",
    venueType: "unique_venue",
    capacity: 80,
    pricePerDay: 1800,
    pricePerHalfDay: 1100,
    phoneNumber: "030 - 555 9012",
    email: "boek@oudebrouwerij.nl",
    additionalDetails: "Historic brewery converted into an event space. Exposed brick walls, original brewing equipment as decor, craft beer tasting available, courtyard garden for summer events.",
  },
];

interface BasicInfoStepProps {
  formData: VenueFormData;
  updateForm: (partial: Partial<VenueFormData>) => void;
}

export default function BasicInfoStep({ formData, updateForm }: BasicInfoStepProps) {
  const handleImageUrlAdd = () => {
    const url = prompt("Enter image URL:");
    if (url && url.startsWith("http")) {
      updateForm({ images: [...formData.images, url] });
    }
  };

  const removeImage = (index: number) => {
    updateForm({ images: formData.images.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Demo Data Loader */}
      <div className="glass-card p-4 border border-dashed border-om-orange/30 bg-om-orange/[0.03]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="h-5 w-5 text-om-orange shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Quick Demo</p>
              <p className="text-xs text-white/50">Load sample venue data to speed up your demo</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {demoVenues.map((demo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => updateForm(demo)}
                className="px-3 py-1.5 rounded-lg bg-om-orange/15 border border-om-orange/25 text-om-orange text-xs font-medium hover:bg-om-orange/25 transition-colors whitespace-nowrap"
              >
                {demo.city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Venue Identity */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-om-orange" />
          Venue Identity
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Venue name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder="e.g. The Innovation Hub Amsterdam"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">City *</label>
              <select
                value={formData.city}
                onChange={(e) => updateForm({ city: e.target.value })}
                className="glass-select w-full px-4 py-2.5 text-sm"
                required
              >
                <option value="">Select city</option>
                {dutchCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Venue type *</label>
              <select
                value={formData.venueType}
                onChange={(e) => updateForm({ venueType: e.target.value })}
                className="glass-select w-full px-4 py-2.5 text-sm"
              >
                {venueTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Full address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder="Street, number, postal code, city"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Capacity & Pricing */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Euro className="h-4 w-4 text-om-orange" />
          Capacity & Pricing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Max capacity *</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="number"
                min={1}
                value={formData.capacity || ""}
                onChange={(e) => updateForm({ capacity: Number(e.target.value) })}
                placeholder="50"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Price per day (EUR) *</label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="number"
                min={0}
                value={formData.pricePerDay || ""}
                onChange={(e) => updateForm({ pricePerDay: Number(e.target.value) })}
                placeholder="1000"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Price per half day (EUR)</label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="number"
                min={0}
                value={formData.pricePerHalfDay || ""}
                onChange={(e) => updateForm({ pricePerHalfDay: Number(e.target.value) })}
                placeholder="600"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Phone className="h-4 w-4 text-om-orange" />
          Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => updateForm({ phoneNumber: e.target.value })}
                placeholder="020 - 123 4567"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="events@yourvenue.nl"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-om-orange" />
          Venue Images
        </h3>

        {formData.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {formData.images.map((url, i) => (
              <div key={i} className="relative group h-24">
                <NextImage
                  src={url}
                  alt={`Venue ${i + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleImageUrlAdd}
          className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 text-sm hover:border-om-orange/40 hover:text-om-orange transition-colors"
        >
          + Add image URL
        </button>
        <p className="text-xs mt-2 text-white/30">
          If no images are provided, default stock images will be used.
        </p>
      </div>

      {/* Additional Details for AI */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-om-orange" />
          Additional Details for AI
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Tell us anything else about your venue that the AI should know when generating your listing content.
          Unique features, atmosphere, nearby landmarks, special services, etc.
        </p>
        <textarea
          value={formData.additionalDetails}
          onChange={(e) => updateForm({ additionalDetails: e.target.value })}
          placeholder="e.g. We have a rooftop terrace with city views, offer organic catering, are located next to the Vondelpark..."
          rows={4}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
        />
      </div>
    </div>
  );
}
