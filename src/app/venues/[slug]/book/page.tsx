import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { parseVenue } from "@/lib/parse-venue";

export const dynamic = "force-dynamic";
import BookingWizard from "@/components/booking/BookingWizard";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; attendees?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const raw = await prisma.venue.findUnique({ where: { slug } });
  if (!raw) notFound();

  const venue = parseVenue(raw as unknown as Record<string, unknown>);
  const initialAttendees = sp.attendees ? parseInt(sp.attendees) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/venues/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-om-orange transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {venue.name}
      </Link>

      <BookingWizard
        venue={venue}
        initialDate={sp.date}
        initialAttendees={initialAttendees}
      />
    </div>
  );
}
