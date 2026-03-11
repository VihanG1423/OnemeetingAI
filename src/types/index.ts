export interface Venue {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  description: string;
  shortDescription: string | null;
  capacity: number;
  pricePerDay: number;
  pricePerHalfDay: number;
  amenities: string[];
  images: string[];
  venueType: string;
  rating: number;
  latitude: number | null;
  longitude: number | null;

  // Rich detail fields
  facilities: FacilityCategory[] | null;
  roomLayouts: RoomLayoutConfig[] | null;
  transportInfo: string | null;
  parkingInfo: string | null;
  termsAndConditions: string | null;
  sustainabilityInfo: string | null;

  // Meeting expert
  meetingExpertName: string | null;
  meetingExpertRole: string | null;
  meetingExpertImage: string | null;

  // Contact
  phoneNumber: string | null;
  email: string | null;

  // Listing management
  status: string;
  isAiGenerated: boolean;
}

export interface FacilityCategory {
  category: string;
  items: string[];
}

export interface RoomLayoutConfig {
  name: string;        // e.g. "Main Hall", "Boardroom A"
  theater: number | null;
  classroom: number | null;
  uShape: number | null;
  boardroom: number | null;
  cabaret: number | null;
  reception: number | null;
}

export interface Booking {
  id: string;
  venueId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  eventDate: string;
  endDate: string | null;
  attendeeCount: number;
  eventType: string | null;
  addOns: Record<string, boolean> | null;
  specialRequests: string | null;
  totalPrice: number;
  status: string;
  createdAt: string;
  venue?: Venue;

  // Enhanced fields
  companyName: string | null;
  ccEmail: string | null;
  onsiteContactPerson: string | null;
  invoiceReference: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  isMultiDay: boolean;
  meetingType: string | null;
  roomLayout: string | null;
  programDescription: string | null;
  cateringOptions: CateringOptions | null;
  avResources: AvResources | null;
  needsHotelRooms: boolean;
  hotelRoomDetails: string | null;
  climateNeutral: boolean;
}

export interface CateringOptions {
  breakfast: boolean;
  lunch: boolean;
  drinks: boolean;
  dinner: boolean;
}

export interface AvResources {
  projector: boolean;
  flip_chart: boolean;
  microphone: boolean;
  sound_system: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  venues?: VenueCardData[];
  bookingDraft?: BookingDraftData;
  suggestions?: string[];
  isStreaming?: boolean;
}

export interface BookingDraftData {
  bookingUrl: string;
  estimatedPrice: number;
  venueName: string;
}

// Meeting types matching legacy platform
export const meetingTypes = [
  { value: "board_meeting", label: "Board Meeting" },
  { value: "workshop", label: "Workshop" },
  { value: "training", label: "Training" },
  { value: "presentation", label: "Presentation" },
  { value: "conference", label: "Conference" },
  { value: "seminar", label: "Seminar" },
  { value: "team_building", label: "Team Building" },
  { value: "networking", label: "Networking Event" },
  { value: "social", label: "Social Event" },
  { value: "other", label: "Other" },
] as const;

// Room layout options
export const roomLayoutOptions = [
  { value: "theater", label: "Theater" },
  { value: "classroom", label: "Classroom" },
  { value: "u_shape", label: "U-Shape" },
  { value: "boardroom", label: "Boardroom" },
  { value: "cabaret", label: "Cabaret" },
  { value: "reception", label: "Reception" },
] as const;

// AI Match scoring
export interface MatchCriteria {
  city?: string;
  capacity?: number;
  budget?: number;
  amenities?: string[];
  venueType?: string;
  meetingType?: string;
  roomLayout?: string;
  catering?: boolean;
  description?: string;
}

export interface VenueMatchResult {
  venueId: string;
  matchPercentage: number;
  topHighlights: string[];
  missingRequirements: string[];
}

export interface VenueCardData {
  name: string;
  slug: string;
  city: string;
  capacity: number;
  pricePerDay: number;
  venueType: string;
  rating: number;
  amenities: string[];
  image: string;
  matchScore?: VenueMatchResult;
}

// Venue creation data
export interface VenueCreateData {
  name: string;
  city: string;
  address: string;
  venueType: string;
  capacity: number;
  pricePerDay: number;
  pricePerHalfDay: number;
  images: string[];
  description?: string;
  shortDescription?: string;
  amenities?: string[];
  facilities?: FacilityCategory[];
  roomLayouts?: RoomLayoutConfig[];
  transportInfo?: string;
  parkingInfo?: string;
  termsAndConditions?: string;
  sustainabilityInfo?: string;
  meetingExpertName?: string;
  meetingExpertRole?: string;
  meetingExpertImage?: string;
  phoneNumber?: string;
  email?: string;
}
