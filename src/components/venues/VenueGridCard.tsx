import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { formatPrice, venueTypeLabel } from "@/lib/utils";
import type { Venue, VenueMatchResult } from "@/types";

function MatchScoreRing({ percentage }: { percentage: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "#4ade80"
      : percentage >= 60
        ? "#FF6B00"
        : "#facc15";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold"
        style={{ color }}
      >
        {percentage}%
      </span>
    </div>
  );
}

interface VenueGridCardProps {
  venue: Venue;
  matchScore?: VenueMatchResult;
}

export default function VenueGridCard({ venue, matchScore }: VenueGridCardProps) {
  const firstImage = venue.images[0] || "";

  return (
    <Link href={`/venues/${venue.slug}`} className="block group">
      <div className="glass-card-light overflow-hidden hover:translate-y-[-2px]">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={firstImage}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges on image */}
          {/* Top-left: venue type badge (always shown) */}
          <div className="absolute top-3 left-3">
            <span className="bg-om-orange/70 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {venueTypeLabel(venue.venueType)}
            </span>
          </div>

          {/* Top-right: price badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-om-orange/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {formatPrice(venue.pricePerDay)}/day
            </span>
          </div>

          {/* Bottom-right: rating */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-om-orange text-om-orange" />
            <span className="text-sm font-medium text-white">{venue.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">
            {venue.name}
          </h3>
          <div className="flex items-center gap-3 mb-3" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {venue.city}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Users className="h-3.5 w-3.5" />
              {venue.capacity}
            </span>
          </div>

          {/* Match highlights or amenities */}
          {matchScore ? (
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1.5">
                {matchScore.topHighlights.map((highlight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{highlight}</span>
                  </div>
                ))}
                {matchScore.missingRequirements.length > 0 && (
                  <div
                    className="flex items-start gap-1.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-400/70 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      Missing: {matchScore.missingRequirements.slice(0, 2).join(", ")}
                    </span>
                  </div>
                )}
              </div>
              <div className="shrink-0">
                <MatchScoreRing percentage={matchScore.matchPercentage} />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {venue.amenities.slice(0, 3).map((a) => (
                <span key={a} className="glass-badge text-[11px]">
                  {a.replace(/_/g, " ")}
                </span>
              ))}
              {venue.amenities.length > 3 && (
                <span className="glass-badge text-[11px]">
                  +{venue.amenities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
