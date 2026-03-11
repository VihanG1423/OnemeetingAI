"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";
import RoomLayoutTable from "./RoomLayoutTable";
import type { Venue } from "@/types";

const tabs = [
  { id: "description", label: "Description & Rooms" },
  { id: "facilities", label: "Facilities" },
  { id: "pricing", label: "Pricing" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function VenueDetailTabs({ venue }: { venue: Venue }) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <div className="glass-card overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3.5 px-4 text-sm font-medium transition-all text-center",
              activeTab === tab.id
                ? "text-om-orange border-b-2 border-om-orange bg-om-orange/5"
                : "text-white/50 hover:text-white/70 hover:bg-white/[0.02]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "description" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white mb-3">About this venue</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {venue.description}
              </p>
            </div>

            {venue.roomLayouts && venue.roomLayouts.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-white mb-3">Room Layouts & Capacity</h3>
                <RoomLayoutTable layouts={venue.roomLayouts} />
              </div>
            )}

            {venue.termsAndConditions && (
              <div>
                <h3 className="text-base font-semibold text-white mb-3">Terms & Conditions</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {venue.termsAndConditions}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "facilities" && (
          <div className="space-y-6">
            {venue.facilities && venue.facilities.length > 0 ? (
              venue.facilities.map((cat, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-white mb-3">{cat.category}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <Check className="h-3.5 w-3.5 text-om-orange shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {venue.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check className="h-3.5 w-3.5 text-om-orange shrink-0" />
                    {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                ))}
              </div>
            )}

            {venue.sustainabilityInfo && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h3 className="text-sm font-semibold text-green-400 mb-2">Sustainability</h3>
                <p className="text-sm text-green-300/80">{venue.sustainabilityInfo}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-xs text-white/50 mb-1">Full Day</div>
                <div className="text-xl font-bold text-white">{formatPrice(venue.pricePerDay)}</div>
                <div className="text-xs text-white/40 mt-1">09:00 - 17:00</div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-xs text-white/50 mb-1">Half Day</div>
                <div className="text-xl font-bold text-white">{formatPrice(venue.pricePerHalfDay)}</div>
                <div className="text-xs text-white/40 mt-1">09:00 - 13:00 or 13:00 - 17:00</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">Available Add-Ons</h4>
              <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="flex justify-between">
                  <span>Catering (per person)</span>
                  <span className="text-white">€35</span>
                </div>
                <div className="flex justify-between">
                  <span>AV Equipment</span>
                  <span className="text-white">€200</span>
                </div>
                <div className="flex justify-between">
                  <span>Video Conferencing</span>
                  <span className="text-white">€150</span>
                </div>
                <div className="flex justify-between">
                  <span>Parking (per car)</span>
                  <span className="text-white">€15</span>
                </div>
                <div className="flex justify-between">
                  <span>Breakout Room</span>
                  <span className="text-white">€100</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/40">
              Prices are indicative. Final quote provided upon booking request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
