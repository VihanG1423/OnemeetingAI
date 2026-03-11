"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";
import { venueTypeLabel } from "@/lib/utils";
import type { MatchCriteria } from "@/types";

const amenityOptions = [
  "wifi", "catering", "projector", "whiteboard", "breakout_rooms",
  "parking", "accessibility", "natural_light", "outdoor_space",
  "kitchen", "av_equipment", "video_conferencing",
];

const venueTypes = [
  "conference_center", "meeting_room", "workshop_space",
  "unique_venue", "hotel", "coworking",
];

interface MatchCriteriaPanelProps {
  onSearch: (criteria: MatchCriteria) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResults: boolean;
}

export default function MatchCriteriaPanel({
  onSearch,
  onClear,
  isLoading,
  hasResults,
}: MatchCriteriaPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [venueType, setVenueType] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSearch = () => {
    const criteria: MatchCriteria = {};
    if (capacity) criteria.capacity = parseInt(capacity);
    if (budget) criteria.budget = parseInt(budget);
    if (city) criteria.city = city;
    if (venueType) criteria.venueType = venueType;
    if (selectedAmenities.length > 0) criteria.amenities = selectedAmenities;
    if (description.trim()) criteria.description = description.trim();
    onSearch(criteria);
  };

  const handleClear = () => {
    setCapacity("");
    setBudget("");
    setCity("");
    setVenueType("");
    setSelectedAmenities([]);
    setDescription("");
    onClear();
  };

  const hasCriteria =
    capacity || budget || city || venueType || selectedAmenities.length > 0 || description;

  return (
    <div className="glass-card p-5 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-om-orange/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-om-orange" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">
              AI Venue Matcher
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tell us what you need and we&apos;ll score every venue for you
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      {expanded && (
        <div className="mt-5 space-y-4">
          {/* Row 1: Capacity + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Attendees
              </label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Max budget/day
              </label>
              <input
                type="number"
                placeholder="e.g. 2000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Row 2: City + Venue Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="glass-select w-full px-3 py-2 text-sm"
              >
                <option value="">Any city</option>
                <option value="Amsterdam">Amsterdam</option>
                <option value="Rotterdam">Rotterdam</option>
                <option value="Utrecht">Utrecht</option>
                <option value="The Hague">The Hague</option>
                <option value="Eindhoven">Eindhoven</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                Venue type
              </label>
              <select
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="glass-select w-full px-3 py-2 text-sm"
              >
                <option value="">Any type</option>
                {venueTypes.map((t) => (
                  <option key={t} value={t}>
                    {venueTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Required amenities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {amenityOptions.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={
                    selectedAmenities.includes(a)
                      ? "glass-pill-orange px-2.5 py-1 text-xs"
                      : "glass-pill px-2.5 py-1 text-xs"
                  }
                  style={
                    !selectedAmenities.includes(a)
                      ? { color: "var(--text-secondary)" }
                      : undefined
                  }
                >
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Describe your ideal venue (optional)
            </label>
            <textarea
              placeholder="e.g. Historic venue with natural daylight for a creative workshop..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="glass-input w-full px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              disabled={!hasCriteria || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-om-orange hover:bg-om-orange-dark text-white text-sm font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isLoading ? "Scoring venues..." : "Find My Match"}
            </button>
            {hasResults && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-full"
                style={{ color: "var(--text-secondary)" }}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
