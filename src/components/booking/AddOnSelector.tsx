"use client";

import {
  UtensilsCrossed,
  Speaker,
  Video,
  Car,
  DoorOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddOn {
  id: string;
  label: string;
  description: string;
  priceLabel: string;
  price: number;
  icon: LucideIcon;
}

const addOns: AddOn[] = [
  {
    id: "catering",
    label: "Catering",
    description: "Lunch, coffee & snacks for all attendees",
    priceLabel: "€35/person",
    price: 35,
    icon: UtensilsCrossed,
  },
  {
    id: "av_equipment",
    label: "AV Equipment",
    description: "Professional sound system & large display",
    priceLabel: "€200 flat",
    price: 200,
    icon: Speaker,
  },
  {
    id: "video_conferencing",
    label: "Video Conferencing",
    description: "HD camera, mic setup & screen sharing",
    priceLabel: "€150 flat",
    price: 150,
    icon: Video,
  },
  {
    id: "parking",
    label: "Parking Passes",
    description: "Reserved parking for attendees",
    priceLabel: "€15/car",
    price: 15,
    icon: Car,
  },
  {
    id: "breakout_rooms",
    label: "Breakout Rooms",
    description: "Additional small rooms for group work",
    priceLabel: "€100/room",
    price: 100,
    icon: DoorOpen,
  },
];

interface AddOnSelectorProps {
  selected: Record<string, boolean>;
  onChange: (addOns: Record<string, boolean>) => void;
}

export default function AddOnSelector({ selected, onChange }: AddOnSelectorProps) {
  const toggle = (id: string) => {
    onChange({ ...selected, [id]: !selected[id] });
  };

  return (
    <div className="space-y-3">
      {addOns.map((addon) => {
        const isActive = selected[addon.id] || false;
        const Icon = addon.icon;

        return (
          <button
            key={addon.id}
            type="button"
            onClick={() => toggle(addon.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
              isActive
                ? "bg-om-orange/10 border-om-orange/30"
                : "bg-white/[0.03] border-white/10 hover:border-white/20"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                isActive ? "bg-om-orange/20" : "bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-om-orange" : "text-white/50"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-white" : "text-white/70"
                  )}
                >
                  {addon.label}
                </span>
                <span className="text-xs text-om-orange font-medium">
                  {addon.priceLabel}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {addon.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { addOns };
export type { AddOn };
