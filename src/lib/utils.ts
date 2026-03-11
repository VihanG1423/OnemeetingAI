import { format } from "date-fns";

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "EEE, d MMM yyyy");
}

export function generateBookingRef(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OM-${dateStr}-${random}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function isDateAvailable(slug: string, dateStr: string): boolean {
  let hash = 0;
  const str = slug + dateStr;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 4 !== 0; // ~75% availability
}

export function venueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    conference_center: "Conference Center",
    meeting_room: "Meeting Room",
    workshop_space: "Workshop Space",
    unique_venue: "Unique Venue",
    hotel: "Hotel",
    coworking: "Co-working",
  };
  return labels[type] || type;
}

export function amenityIcon(amenity: string): string {
  const icons: Record<string, string> = {
    wifi: "Wifi",
    catering: "UtensilsCrossed",
    projector: "Monitor",
    whiteboard: "PenSquare",
    breakout_rooms: "DoorOpen",
    parking: "Car",
    accessibility: "Accessibility",
    natural_light: "Sun",
    outdoor_space: "TreePine",
    kitchen: "ChefHat",
    av_equipment: "Speaker",
    video_conferencing: "Video",
  };
  return icons[amenity] || "Check";
}

export function amenityLabel(amenity: string): string {
  const labels: Record<string, string> = {
    wifi: "WiFi",
    catering: "Catering",
    projector: "Projector",
    whiteboard: "Whiteboard",
    breakout_rooms: "Breakout Rooms",
    parking: "Parking",
    accessibility: "Accessible",
    natural_light: "Natural Light",
    outdoor_space: "Outdoor Space",
    kitchen: "Kitchen",
    av_equipment: "AV Equipment",
    video_conferencing: "Video Conferencing",
  };
  return labels[amenity] || amenity;
}
