import Link from "next/link";
import Image from "next/image";
import { MessageSquareText, Building2, CalendarCheck, MapPin, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";
import ChatInterface from "@/components/chat/ChatInterface";
import VenueGridCard from "@/components/venues/VenueGridCard";
import type { Venue } from "@/types";

const cities = [
  { name: "Amsterdam", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400" },
  { name: "Rotterdam", image: "https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?w=400" },
  { name: "Utrecht", image: "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=400" },
  { name: "The Hague", image: "https://images.unsplash.com/photo-1560439513-74b037a25d84?w=400" },
  { name: "Eindhoven", image: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=400" },
];

const steps = [
  {
    icon: MessageSquareText,
    title: "Tell Our AI What You Need",
    description: "Describe your event — attendees, location, budget, date. Our AI understands natural language.",
  },
  {
    icon: Building2,
    title: "Browse Recommended Venues",
    description: "Get instant, personalized venue recommendations from our database of 1500+ Dutch venues.",
  },
  {
    icon: CalendarCheck,
    title: "Book in Minutes",
    description: "Select your venue, pick add-ons, and submit your booking request. We confirm within 24 hours.",
  },
];

export default async function HomePage() {
  const rawVenues = await prisma.venue.findMany({
    orderBy: { rating: "desc" },
    take: 6,
  });

  const featuredVenues: Venue[] = rawVenues.map((v) => parseVenue(v as unknown as Record<string, unknown>));

  // Count venues per city
  const venueCounts = await prisma.venue.groupBy({
    by: ["city"],
    _count: true,
  });
  const countMap: Record<string, number> = {};
  for (const vc of venueCounts) {
    countMap[vc.city] = vc._count;
  }

  return (
    <div>
      {/* Hero Section — side-by-side on desktop */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Hero text + How It Works */}
          <div className="animate-fade-in-up">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
              Find Your Perfect
              <br />
              <span className="text-om-orange">Meeting Space</span>
            </h1>
            <p
              className="text-base sm:text-lg mb-8 lg:mb-10"
              style={{ color: "var(--text-secondary)" }}
            >
              AI-powered venue search across 1500+ locations in the Netherlands.
              Tell our AI what you need and get instant recommendations.
            </p>

            {/* How It Works — inline on left side */}
            <div className="space-y-4">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex items-start gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${(i + 1) * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-om-orange/15 border border-om-orange/25 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-om-orange" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="animate-fade-in-up stagger-2 lg:sticky lg:top-24">
            <ChatInterface compact />
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Popular Venues</h2>
          <Link
            href="/venues"
            className="glass-pill-orange px-4 py-2 text-sm font-medium flex items-center gap-1.5"
          >
            Browse All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredVenues.map((venue) => (
            <VenueGridCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">
          Venues Across the Netherlands
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={`/venues?city=${encodeURIComponent(city.name)}`}
              className="glass-card-light overflow-hidden group hover:translate-y-[-2px]"
            >
              <div className="relative h-28">
                <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-sm font-semibold text-white">{city.name}</h3>
                  <p className="text-xs text-white/60 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {countMap[city.name] || 0} venues
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
