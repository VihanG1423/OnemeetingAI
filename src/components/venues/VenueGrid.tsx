"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import VenueGridCard from "./VenueGridCard";
import MatchCriteriaPanel from "./MatchCriteriaPanel";
import ExpertCTA from "./ExpertCTA";
import { venueTypeLabel } from "@/lib/utils";
import type { Venue, MatchCriteria, VenueMatchResult } from "@/types";

const cities = ["All", "Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"];
const venueTypes = ["all", "conference_center", "meeting_room", "workshop_space", "unique_venue", "hotel", "coworking"];

interface VenueGridProps {
  venues: Venue[];
  initialCity?: string;
  initialType?: string;
}

export default function VenueGrid({ venues, initialCity, initialType }: VenueGridProps) {
  const [city, setCity] = useState(initialCity || "All");
  const [type, setType] = useState(initialType || "all");
  const [search, setSearch] = useState("");
  const [matchScores, setMatchScores] = useState<Map<string, VenueMatchResult>>(new Map());
  const [isScoring, setIsScoring] = useState(false);
  const [activeCriteria, setActiveCriteria] = useState<MatchCriteria | null>(null);

  const filtered = useMemo(() => {
    let results = venues.filter((v) => {
      if (city !== "All" && v.city !== city) return false;
      if (type !== "all" && v.venueType !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sort by match score if we have scores
    if (matchScores.size > 0) {
      results = [...results].sort((a, b) => {
        const scoreA = matchScores.get(a.id)?.matchPercentage ?? -1;
        const scoreB = matchScores.get(b.id)?.matchPercentage ?? -1;
        return scoreB - scoreA;
      });
    }

    return results;
  }, [venues, city, type, search, matchScores]);

  const bestMatch = useMemo(() => {
    if (matchScores.size === 0) return 100;
    const scores = Array.from(matchScores.values());
    return Math.max(...scores.map((s) => s.matchPercentage));
  }, [matchScores]);

  const handleMatchSearch = async (criteria: MatchCriteria) => {
    setIsScoring(true);
    setActiveCriteria(criteria);
    try {
      const res = await fetch("/api/venues/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      const data = await res.json();
      if (data.scores) {
        const scoreMap = new Map<string, VenueMatchResult>();
        for (const score of data.scores) {
          scoreMap.set(score.venueId, score);
        }
        setMatchScores(scoreMap);
      }
    } catch {
      console.error("Failed to score venues");
    } finally {
      setIsScoring(false);
    }
  };

  const handleClearMatch = () => {
    setMatchScores(new Map());
    setActiveCriteria(null);
  };

  return (
    <div>
      {/* AI Match Criteria Panel */}
      <MatchCriteriaPanel
        onSearch={handleMatchSearch}
        onClear={handleClearMatch}
        isLoading={isScoring}
        hasResults={matchScores.size > 0}
      />

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
          />
        </div>

        {/* City pills */}
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={
                city === c
                  ? "glass-pill-orange px-4 py-1.5 text-sm font-medium"
                  : "glass-pill px-4 py-1.5 text-sm font-medium"
              }
              style={city !== c ? { color: "var(--text-secondary)" } : undefined}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-2">
          {venueTypes.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={
                type === t
                  ? "glass-pill-orange px-3 py-1 text-xs font-medium"
                  : "glass-pill px-3 py-1 text-xs font-medium"
              }
              style={type !== t ? { color: "var(--text-secondary)" } : undefined}
            >
              {t === "all" ? "All Types" : venueTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        {filtered.length} venue{filtered.length !== 1 ? "s" : ""} found
        {matchScores.size > 0 && " — sorted by match score"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((venue) => (
            <VenueGridCard
              key={venue.id}
              venue={venue}
              matchScore={matchScores.get(venue.id)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-lg font-medium text-white mb-2">No venues found</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Try adjusting your filters or search term.
          </p>
        </div>
      )}

      {/* Expert CTA - show when match scores are low or always at bottom */}
      {(bestMatch < 70 || matchScores.size > 0) && (
        <div className="mt-8">
          <ExpertCTA criteria={activeCriteria || undefined} />
        </div>
      )}
    </div>
  );
}
