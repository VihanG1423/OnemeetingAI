"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import VenueDetailTabs from "./VenueDetailTabs";
import VenueSidebar from "./VenueSidebar";
import type { Venue } from "@/types";

export default function VenueDetail({ venue }: { venue: Venue }) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/venues"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-om-orange transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to venues
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="glass-card overflow-hidden">
            <div className="relative h-64 sm:h-80 md:h-96">
              <Image
                src={venue.images[currentImage]}
                alt={venue.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {venue.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === 0 ? venue.images.length - 1 : p - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === venue.images.length - 1 ? 0 : p + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </>
              )}

              {/* Image dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {venue.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentImage ? "w-6 bg-om-orange" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Title + meta */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {venue.name}
            </h1>
            {venue.shortDescription && (
              <p className="text-sm mb-3 italic" style={{ color: "var(--text-secondary)" }}>
                {venue.shortDescription}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4" style={{ color: "var(--text-secondary)" }}>
              <span className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4" />
                {venue.address}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4" />
                Up to {venue.capacity} guests
              </span>
            </div>
          </div>

          {/* Tabbed content */}
          <VenueDetailTabs venue={venue} />
        </div>

        {/* Right column — sidebar */}
        <VenueSidebar venue={venue} />
      </div>
    </div>
  );
}
