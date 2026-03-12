export default function VenueGridCardSkeleton() {
  return (
    <div className="glass-card-light overflow-hidden">
      {/* Image area shimmer */}
      <div className="relative h-48 bg-white/5 animate-pulse">
        {/* Type badge placeholder */}
        <div className="absolute top-3 left-3">
          <div className="h-6 w-20 rounded-full bg-white/10" />
        </div>
        {/* Match ring placeholder */}
        <div className="absolute top-3 right-3">
          <div className="h-12 w-12 rounded-full bg-white/10" />
        </div>
        {/* Price badge placeholder */}
        <div className="absolute bottom-3 right-3">
          <div className="h-6 w-24 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Content area shimmer */}
      <div className="p-5 space-y-3">
        {/* Title line */}
        <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
        {/* Metadata line */}
        <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
        {/* Highlight line 1 */}
        <div className="h-3.5 w-full rounded bg-white/5 animate-pulse" />
        {/* Highlight line 2 */}
        <div className="h-3.5 w-5/6 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
