"use client";

import { useState, useMemo } from "react";
import VenueGridCard from "./VenueGridCard";
import MatchCriteriaPanel from "./MatchCriteriaPanel";
import ExpertCTA from "./ExpertCTA";
import type { Venue, MatchCriteria, VenueMatchResult } from "@/types";

interface VenueGridProps {
  venues: Venue[];
}

export default function VenueGrid({ venues }: VenueGridProps) {
  const [matchScores, setMatchScores] = useState<Map<string, VenueMatchResult>>(new Map());
  const [scoredVenueIds, setScoredVenueIds] = useState<Set<string>>(new Set());
  const [isScoring, setIsScoring] = useState(false);
  const [activeCriteria, setActiveCriteria] = useState<MatchCriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasResults = matchScores.size > 0;

  // Split venues into matched (scored) and ruled-out (not scored)
  const { matchedVenues, ruledOutVenues } = useMemo(() => {
    if (!hasResults) {
      return { matchedVenues: [], ruledOutVenues: [] };
    }

    const matched: Array<{ venue: Venue; score: VenueMatchResult }> = [];
    const ruledOut: Venue[] = [];

    for (const venue of venues) {
      if (scoredVenueIds.has(venue.id)) {
        const score = matchScores.get(venue.id);
        if (score) {
          matched.push({ venue, score });
        }
      } else {
        ruledOut.push(venue);
      }
    }

    // Sort matched by score descending
    matched.sort((a, b) => b.score.matchPercentage - a.score.matchPercentage);

    return { matchedVenues: matched, ruledOutVenues: ruledOut };
  }, [venues, matchScores, scoredVenueIds, hasResults]);

  const bestMatch = useMemo(() => {
    if (matchScores.size === 0) return 100;
    const scores = Array.from(matchScores.values());
    return Math.max(...scores.map((s) => s.matchPercentage));
  }, [matchScores]);

  const handleMatchSearch = async (criteria: MatchCriteria) => {
    setIsScoring(true);
    setActiveCriteria(criteria);
    setError(null);
    try {
      const res = await fetch("/api/venues/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to score venues");
      }
      if (data.scores) {
        const scoreMap = new Map<string, VenueMatchResult>();
        for (const score of data.scores) {
          scoreMap.set(score.venueId, score);
        }
        setMatchScores(scoreMap);
        setScoredVenueIds(new Set(data.scoredVenueIds || []));
      }
    } catch {
      setError("Something went wrong scoring venues. Please try again.");
      setMatchScores(new Map());
      setScoredVenueIds(new Set());
    } finally {
      setIsScoring(false);
    }
  };

  const handleClearMatch = () => {
    setMatchScores(new Map());
    setScoredVenueIds(new Set());
    setActiveCriteria(null);
    setError(null);
  };

  return (
    <div>
      {/* AI Venue Matcher — the single entry point for filtering and scoring */}
      <MatchCriteriaPanel
        onSearch={handleMatchSearch}
        onClear={handleClearMatch}
        isLoading={isScoring}
        hasResults={hasResults}
        matchedVenues={matchedVenues}
        error={error}
      />

      {/* Before matching: show all venues in a flat grid */}
      {!hasResults && !isScoring && (
        <>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {venues.length} venue{venues.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>
        </>
      )}

      {/* After matching: show ruled-out venues below a divider */}
      {hasResults && ruledOutVenues.length > 0 && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Other Venues
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
          </div>

          {/* Ruled-out venue grid — dimmed */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ opacity: 0.7 }}
          >
            {ruledOutVenues.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>
        </>
      )}

      {/* Expert CTA — show when best match score < 70% */}
      {hasResults && bestMatch < 70 && (
        <div className="mt-8">
          <ExpertCTA criteria={activeCriteria || undefined} />
        </div>
      )}
    </div>
  );
}
