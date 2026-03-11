import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";
import VenueDetail from "@/components/venues/VenueDetail";

export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await prisma.venue.findUnique({ where: { slug } });
  if (!venue) return { title: "Venue Not Found" };
  return {
    title: `${venue.name} - OneMeeting`,
    description: venue.shortDescription || venue.description.slice(0, 160),
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = await prisma.venue.findUnique({ where: { slug } });

  if (!raw) notFound();

  const venue = parseVenue(raw as unknown as Record<string, unknown>);

  return <VenueDetail venue={venue} />;
}
