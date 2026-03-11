import {
  Wifi,
  UtensilsCrossed,
  Monitor,
  PenSquare,
  DoorOpen,
  Car,
  Accessibility,
  Sun,
  TreePine,
  ChefHat,
  Speaker,
  Video,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const amenityConfig: Record<string, { icon: LucideIcon; label: string }> = {
  wifi: { icon: Wifi, label: "WiFi" },
  catering: { icon: UtensilsCrossed, label: "Catering" },
  projector: { icon: Monitor, label: "Projector" },
  whiteboard: { icon: PenSquare, label: "Whiteboard" },
  breakout_rooms: { icon: DoorOpen, label: "Breakout Rooms" },
  parking: { icon: Car, label: "Parking" },
  accessibility: { icon: Accessibility, label: "Accessible" },
  natural_light: { icon: Sun, label: "Natural Light" },
  outdoor_space: { icon: TreePine, label: "Outdoor Space" },
  kitchen: { icon: ChefHat, label: "Kitchen" },
  av_equipment: { icon: Speaker, label: "AV Equipment" },
  video_conferencing: { icon: Video, label: "Video Conferencing" },
};

export default function AmenityBadge({ amenity }: { amenity: string }) {
  const config = amenityConfig[amenity] || { icon: Check, label: amenity };
  const Icon = config.icon;

  return (
    <span className="glass-badge gap-1.5">
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
