import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";
import VenueGrid from "@/components/venues/VenueGrid";

export const metadata = {
  title: "Browse Venues - OneMeeting",
  description: "Explore 1500+ meeting and event venues across the Netherlands.",
};

export default async function VenuesPage() {
  const rawVenues = await prisma.venue.findMany({
    where: { status: "approved" },
    orderBy: { rating: "desc" },
  });

  const venues = rawVenues.map((v) => parseVenue(v as unknown as Record<string, unknown>));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Venues</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Discover the perfect space for your next meeting or event across the Netherlands.
        </p>
      </div>

      <VenueGrid venues={venues} />
    </div>
  );
}
