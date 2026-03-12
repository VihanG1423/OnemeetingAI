"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Star, CheckCircle2, AlertCircle, ChevronUp } from "lucide-react";
import { formatPrice, venueTypeLabel } from "@/lib/utils";
import type { VenueCardData } from "@/types";

function MatchBadge({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? "text-green-400 border-green-400/40 bg-green-400/10"
      : percentage >= 60
        ? "text-om-orange border-om-orange/40 bg-om-orange/10"
        : "text-red-400 border-red-400/40 bg-red-400/10";

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}
    >
      {percentage}% match
    </div>
  );
}

interface VenueCardProps {
  venue: VenueCardData;
  onAskAbout?: (venueName: string) => void;
}

export default function VenueCard({ venue, onAskAbout }: VenueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass-card-light overflow-hidden transition-all duration-300 ${
        expanded ? "min-w-[320px] max-w-[400px]" : "min-w-[260px] max-w-[300px] cursor-pointer hover:translate-y-[-1px]"
      }`}
      onClick={() => !expanded && setExpanded(true)}
    >
      {venue.image && (
        <div className="h-32 overflow-hidden relative">
          <Image
            src={venue.image}
            alt={venue.name}
            fill
            className="object-cover"
          />
          {venue.matchScore && (
            <div className="absolute top-2 right-2">
              <MatchBadge percentage={venue.matchScore.matchPercentage} />
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-semibold text-white line-clamp-1">
            {venue.name}
          </h4>
          <span className="flex items-center gap-0.5 text-xs shrink-0">
            <Star className="h-3 w-3 fill-om-orange text-om-orange" />
            {venue.rating}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {venue.city}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {venue.capacity}
          </span>
        </div>

        {/* Match highlights */}
        {venue.matchScore && venue.matchScore.topHighlights.length > 0 && (
          <div className="mb-2 space-y-0.5">
            {venue.matchScore.topHighlights.map((highlight, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{highlight}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="glass-badge-orange text-[11px]">
            {venueTypeLabel(venue.venueType)}
          </span>
          <span className="text-xs font-medium text-om-orange">
            {formatPrice(venue.pricePerDay)}/day
          </span>
        </div>
      </div>

      {/* Expanded details section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Amenities */}
          <div>
            <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {venue.amenities.map(a => (
                <span key={a} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/60">
                  {a.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Missing requirements */}
          {venue.matchScore?.missingRequirements && venue.matchScore.missingRequirements.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Missing</p>
              <div className="space-y-0.5">
                {venue.matchScore.missingRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-400/70">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {onAskAbout && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAskAbout(venue.name); }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-om-orange/10 border border-om-orange/20 text-om-orange text-xs font-medium hover:bg-om-orange/20 transition-colors"
              >
                Ask about this venue
              </button>
            )}
            <Link
              href={`/venues/${venue.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
            >
              Full page →
            </Link>
          </div>

          {/* Collapse button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="w-full flex items-center justify-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors pt-1"
          >
            <ChevronUp className="h-3 w-3" />
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
