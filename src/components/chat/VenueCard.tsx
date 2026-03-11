import Link from "next/link";
import { MapPin, Users, Star, CheckCircle2 } from "lucide-react";
import { formatPrice, venueTypeLabel } from "@/lib/utils";
import type { VenueCardData } from "@/types";

function MatchBadge({ percentage }: { percentage: number }) {
  const color =
    percentage >= 80
      ? "text-green-400 border-green-400/40 bg-green-400/10"
      : percentage >= 60
        ? "text-om-orange border-om-orange/40 bg-om-orange/10"
        : "text-yellow-400 border-yellow-400/40 bg-yellow-400/10";

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}
    >
      {percentage}% match
    </div>
  );
}

export default function VenueCard({ venue }: { venue: VenueCardData }) {
  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="block glass-card-light overflow-hidden hover:translate-y-[-1px] transition-transform min-w-[260px] max-w-[300px]"
    >
      {venue.image && (
        <div className="h-32 overflow-hidden relative">
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover"
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
    </Link>
  );
}
