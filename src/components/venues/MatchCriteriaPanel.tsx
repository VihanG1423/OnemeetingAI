"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Shuffle } from "lucide-react";
import { venueTypeLabel } from "@/lib/utils";
import VenueGridCard from "./VenueGridCard";
import VenueGridCardSkeleton from "./VenueGridCardSkeleton";
import type { MatchCriteria, Venue, VenueMatchResult } from "@/types";

const cityOptions = ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"];

const amenityOptions = [
  "wifi", "catering", "projector", "whiteboard", "breakout_rooms",
  "parking", "accessibility", "natural_light", "outdoor_space",
  "kitchen", "av_equipment", "video_conferencing",
];

const venueTypeOptions = [
  "conference_center", "meeting_room", "workshop_space",
  "unique_venue", "hotel", "coworking",
];

interface MatchCriteriaPanelProps {
  onSearch: (criteria: MatchCriteria) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResults: boolean;
  matchedVenues: Array<{ venue: Venue; score: VenueMatchResult }>;
  error: string | null;
}

export default function MatchCriteriaPanel({
  onSearch,
  onClear,
  isLoading,
  hasResults,
  matchedVenues,
  error,
}: MatchCriteriaPanelProps) {
  const [capacity, setCapacity] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleVenueType = (type: string) => {
    setSelectedVenueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

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
    if (selectedCities.length > 0) criteria.cities = selectedCities;
    if (selectedVenueTypes.length > 0) criteria.venueTypes = selectedVenueTypes;
    if (selectedAmenities.length > 0) criteria.amenities = selectedAmenities;
    if (description.trim()) criteria.description = description.trim();
    onSearch(criteria);
  };

  const handleClear = () => {
    setCapacity("");
    setBudget("");
    setSelectedCities([]);
    setSelectedVenueTypes([]);
    setSelectedAmenities([]);
    setDescription("");
    onClear();
  };

  const demoDescriptions = [
    "Modern space with lots of natural light for a full-day strategy workshop with breakout sessions",
    "Inspiring venue near the city center for a creative brainstorm with our design team",
    "Professional setting for a board meeting with catering and AV equipment included",
    "Relaxed atmosphere for a team offsite with outdoor space for networking breaks",
    "Centrally located venue for a product launch event with room for presentations and demos",
    "Quiet, focused environment for an executive retreat with high-end catering options",
    "Flexible space for a hackathon weekend with good wifi and plenty of power outlets",
    "Unique historic venue for a client dinner and evening networking event",
  ];

  const fillDemo = () => {
    const pick = <T,>(arr: T[], min: number, max: number): T[] => {
      const count = min + Math.floor(Math.random() * (max - min + 1));
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };
    setCapacity(String([20, 30, 50, 75, 100, 150, 200][Math.floor(Math.random() * 7)]));
    setBudget(String([500, 1000, 1500, 2000, 3000, 5000][Math.floor(Math.random() * 6)]));
    setSelectedCities(pick(cityOptions, 1, 2));
    setSelectedVenueTypes(pick(venueTypeOptions, 1, 2));
    setSelectedAmenities(pick(amenityOptions, 2, 4));
    setDescription(demoDescriptions[Math.floor(Math.random() * demoDescriptions.length)]);
  };

  const hasCriteria =
    capacity ||
    budget ||
    selectedCities.length > 0 ||
    selectedVenueTypes.length > 0 ||
    selectedAmenities.length > 0 ||
    description;

  return (
    <div className="glass-card p-5 mb-6" style={{ borderColor: "rgba(255,107,0,0.2)" }}>
      {/* Header — always visible, not collapsible */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-full bg-om-orange/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-om-orange" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            AI Venue Matcher
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Tell us what you need and we&apos;ll score every venue for you
          </p>
        </div>
        <button
          onClick={fillDemo}
          title="Fill with random demo data"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors hover:bg-white/10"
          style={{ color: "var(--text-muted)" }}
        >
          <Shuffle className="h-3 w-3" />
          Demo
        </button>
      </div>

      {/* Criteria Form — always expanded */}
      <div className="space-y-4">
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
              Max budget/day (EUR)
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

        {/* City — multi-select pill toggles */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            City
          </label>
          <div className="flex flex-wrap gap-1.5">
            {cityOptions.map((c) => (
              <button
                key={c}
                onClick={() => toggleCity(c)}
                aria-pressed={selectedCities.includes(c)}
                className={
                  selectedCities.includes(c)
                    ? "glass-pill-orange px-2.5 py-1 text-xs"
                    : "glass-pill px-2.5 py-1 text-xs"
                }
                style={
                  !selectedCities.includes(c)
                    ? { color: "var(--text-secondary)" }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Type — multi-select pill toggles */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Venue type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {venueTypeOptions.map((t) => (
              <button
                key={t}
                onClick={() => toggleVenueType(t)}
                aria-pressed={selectedVenueTypes.includes(t)}
                className={
                  selectedVenueTypes.includes(t)
                    ? "glass-pill-orange px-2.5 py-1 text-xs"
                    : "glass-pill px-2.5 py-1 text-xs"
                }
                style={
                  !selectedVenueTypes.includes(t)
                    ? { color: "var(--text-secondary)" }
                    : undefined
                }
              >
                {venueTypeLabel(t)}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities — multi-select pill toggles (existing pattern) */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Required amenities
          </label>
          <div className="flex flex-wrap gap-1.5">
            {amenityOptions.map((a) => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                aria-pressed={selectedAmenities.includes(a)}
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
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scoring venues...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Find My Match
              </>
            )}
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

      {/* ─── Results Area ─── */}
      {/* Shown during loading (skeletons), after results, or on error */}
      {(isLoading || hasResults || error) && (
        <div
          className="mt-5 pt-5"
          style={{ borderTop: "1px solid rgba(255,107,0,0.15)" }}
        >
          {/* Error state */}
          {error && !isLoading && (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
          )}

          {/* Loading state — skeleton shimmer */}
          {isLoading && (
            <>
              <div className="flex items-center gap-2.5 mb-4">
                <Loader2 className="h-4 w-4 text-om-orange animate-spin" />
                <span className="text-xs font-medium text-om-orange">
                  Scoring venues against your criteria...
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VenueGridCardSkeleton key={i} />
                ))}
              </div>
            </>
          )}

          {/* Results — matched venue cards */}
          {!isLoading && !error && hasResults && (
            <>
              <p className="text-xs font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
                {matchedVenues.length} venue{matchedVenues.length !== 1 ? "s" : ""} matched
                {selectedCities.length > 0 && ` in ${selectedCities.join(" + ")}`}
                {" — sorted by match score"}
              </p>
              {matchedVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedVenues.map(({ venue, score }) => (
                    <VenueGridCard
                      key={venue.id}
                      venue={venue}
                      matchScore={score}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No venues matched your criteria. Try adjusting your filters or talk to an expert.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
