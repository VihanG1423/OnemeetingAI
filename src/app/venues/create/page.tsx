import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import VenueCreateWizard from "@/components/venues/create/VenueCreateWizard";

export const metadata = {
  title: "List Your Venue - OneMeeting",
  description: "Create an AI-enhanced venue listing on OneMeeting. Reach thousands of meeting organizers across the Netherlands.",
};

export default function CreateVenuePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/venues"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:text-om-orange transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to venues
      </Link>

      <VenueCreateWizard />
    </div>
  );
}
