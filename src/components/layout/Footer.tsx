import Link from "next/link";

const cities = ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"];
const venueTypes = [
  { label: "Conference Centers", type: "conference_center" },
  { label: "Meeting Rooms", type: "meeting_room" },
  { label: "Workshop Spaces", type: "workshop_space" },
  { label: "Unique Venues", type: "unique_venue" },
];

export default function Footer() {
  return (
    <footer className="glass-card-dark mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-om-orange">
                <span className="text-base font-bold text-white">O</span>
              </div>
              <div>
                <span className="text-base font-semibold text-white">One</span>
                <span className="text-base font-semibold text-om-orange">Meeting</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              AI-powered venue booking for meetings and events across the Netherlands. Since 1982.
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Cities</h3>
            <ul className="space-y-2">
              {cities.map((city) => (
                <li key={city}>
                  <Link
                    href={`/venues?city=${encodeURIComponent(city)}`}
                    className="text-sm hover:text-om-orange transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Venue Types */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Venue Types</h3>
            <ul className="space-y-2">
              {venueTypes.map((vt) => (
                <li key={vt.type}>
                  <Link
                    href={`/venues?type=${vt.type}`}
                    className="text-sm hover:text-om-orange transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {vt.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 border-t border-white/10 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          &copy; {new Date().getFullYear()} OneMeeting. AI-powered demo. B Corp certified family business since 1982.
        </div>
      </div>
    </footer>
  );
}
