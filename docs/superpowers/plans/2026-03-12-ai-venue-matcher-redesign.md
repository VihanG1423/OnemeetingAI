# AI Venue Matcher Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Browse Venues page so the AI Venue Matcher card becomes the single entry point for all venue filtering and scoring — owning criteria inputs, matched results display, and separating ruled-out venues below a divider.

**Architecture:** The `MatchCriteriaPanel` component expands to own both the criteria form (with multi-select pill toggles for city, venue type, and amenities) and the matched results grid. `VenueGrid` removes its own search/filter UI and splits venues into "matched" (inside the matcher card) and "ruled-out" (below a divider, dimmed). The API returns `scoredVenueIds` alongside scores so the frontend knows which venues were scored.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma + LibSQL, OpenAI GPT-4o-mini for scoring

**Spec:** `docs/superpowers/specs/2026-03-12-ai-venue-matcher-redesign-design.md`

**Note on testing:** This project has no test framework installed (no jest/vitest). Each task uses `npm run build` (TypeScript compilation + Next.js build) as the verification step. Visual verification is done by running the dev server and inspecting the page.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types/index.ts` | Update `MatchCriteria` — `city→cities[]`, `venueType→venueTypes[]` |
| Modify | `src/app/api/venues/match/route.ts` | Multi-select pre-filter logic + add `scoredVenueIds` to response |
| Create | `src/components/venues/VenueGridCardSkeleton.tsx` | Skeleton shimmer placeholder card for loading state |
| Modify | `src/components/venues/MatchCriteriaPanel.tsx` | Multi-select pills for city/type, results grid, error/loading states |
| Modify | `src/components/venues/VenueGridCard.tsx` | Matched card badge positions — match ring top-right, price bottom-right, rating bottom-left |
| Modify | `src/components/venues/VenueGrid.tsx` | Remove search/filter UI, split matched vs ruled-out, pass data to MatchCriteriaPanel |
| Modify | `src/app/venues/page.tsx` | Remove `searchParams`/`initialCity`/`initialType` — no longer needed |

---

## Chunk 1: Type Changes + API Update

### Task 1: Update `MatchCriteria` type for multi-select

**Files:**
- Modify: `src/types/index.ts:146-156`

- [ ] **Step 1: Update the MatchCriteria interface**

In `src/types/index.ts`, replace the `MatchCriteria` interface with multi-select fields:

```typescript
// AI Match scoring
export interface MatchCriteria {
  cities?: string[];       // was: city?: string — multi-select
  capacity?: number;
  budget?: number;
  amenities?: string[];
  venueTypes?: string[];   // was: venueType?: string — multi-select
  meetingType?: string;    // retained for AI Venue Finder (chat), NOT used in Browse form
  roomLayout?: string;     // retained for AI Venue Finder (chat), NOT used in Browse form
  catering?: boolean;      // retained for AI Venue Finder (chat), NOT used in Browse form
  description?: string;
}
```

- [ ] **Step 2: Verify the build compiles (expect failures in consumers)**

Run: `npm run build`

Expected: Build will fail because `MatchCriteriaPanel.tsx`, `VenueGrid.tsx`, and `route.ts` still reference `criteria.city` and `criteria.venueType`. This confirms our type change is being picked up. Note the errors — we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit type change**

```bash
git add src/types/index.ts
git commit -m "feat: update MatchCriteria type — city→cities[], venueType→venueTypes[]

Multi-select support for city and venue type in AI Venue Matcher.
meetingType, roomLayout, catering retained for AI Venue Finder chat."
```

---

### Task 2: Update API route for multi-select filtering + scoredVenueIds

**Files:**
- Modify: `src/app/api/venues/match/route.ts`

- [ ] **Step 1: Update the pre-filter logic for multi-select**

In `src/app/api/venues/match/route.ts`, replace the current pre-filter logic (lines 32-39) and response (line 65). The full updated file:

```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreVenueMatches } from "@/lib/venue-tools";
import type { MatchCriteria } from "@/types";

export async function POST(request: Request) {
  try {
    const { criteria, venueIds } = (await request.json()) as {
      criteria: MatchCriteria;
      venueIds?: string[];
    };

    if (!criteria || Object.keys(criteria).length === 0) {
      return NextResponse.json(
        { error: "Criteria is required" },
        { status: 400 }
      );
    }

    // Fetch venues - either specific ones or all approved
    const where: Record<string, unknown> = { status: "approved" };
    if (venueIds && venueIds.length > 0) {
      where.id = { in: venueIds };
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { rating: "desc" },
    });

    // Pre-filter by hard criteria before sending to AI
    const preFiltered = venues.filter((v) => {
      // Multi-city: venue must match at least one selected city
      if (criteria.cities && criteria.cities.length > 0) {
        const matchesCity = criteria.cities.some(
          (c) => c.toLowerCase() === v.city.toLowerCase()
        );
        if (!matchesCity) return false;
      }
      if (criteria.capacity && v.capacity < criteria.capacity) return false;
      if (criteria.budget && v.pricePerDay > criteria.budget) return false;
      // Multi venue type: venue must match at least one selected type
      if (criteria.venueTypes && criteria.venueTypes.length > 0) {
        if (!criteria.venueTypes.includes(v.venueType)) return false;
      }
      return true;
    });

    // Also include some that partially match (different city/over budget) for variety
    const softMatches = venues
      .filter((v) => !preFiltered.includes(v))
      .slice(0, 3);

    const toScore = [...preFiltered.slice(0, 10), ...softMatches].map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      city: v.city,
      capacity: v.capacity,
      pricePerDay: v.pricePerDay,
      venueType: v.venueType,
      amenities: JSON.parse(v.amenities) as string[],
      rating: v.rating,
      description: v.description,
      roomLayouts: v.roomLayouts,
    }));

    const scores = await scoreVenueMatches(criteria, toScore);

    // Sort by match percentage descending
    scores.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Collect IDs of all scored venues so frontend can split matched vs ruled-out
    const scoredVenueIds = toScore.map((v) => v.id);

    return NextResponse.json({ scores, scoredVenueIds });
  } catch (error) {
    console.error("Match scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score venues" },
      { status: 500 }
    );
  }
}
```

Key changes from current code:
- Line 34-41: City filter uses `criteria.cities?.some(...)` for multi-select
- Line 44-46: Venue type filter uses `criteria.venueTypes?.includes(...)` for multi-select
- Line 64: Collect `scoredVenueIds` from all venues sent to the scorer
- Line 66: Return `{ scores, scoredVenueIds }` instead of just `{ scores }`

- [ ] **Step 2: Update scoreVenueMatches criteria description for multi-select**

In `src/lib/venue-tools.ts`, the `scoreVenueMatches` function (line 306) already handles criteria generically via `Object.entries(criteria)` → no code change needed. The `cities` and `venueTypes` arrays will be serialized as comma-separated values automatically by the `.map(([k, v]) => ...)` on line 327. Confirm this by reading the function — no edit required.

- [ ] **Step 3: Verify the build compiles for the API route**

Run: `npm run build`

Expected: API route compiles. Build may still fail on frontend components that reference `criteria.city` — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 4: Commit API changes**

```bash
git add src/app/api/venues/match/route.ts
git commit -m "feat: API multi-select city/venueType filtering + scoredVenueIds response

Pre-filter supports arrays: cities matches any selected city (case-insensitive),
venueTypes matches any selected type. Response includes scoredVenueIds for
frontend to split matched vs ruled-out venues."
```

---

## Chunk 2: Skeleton Component + VenueGridCard Badge Changes

### Task 3: Create VenueGridCardSkeleton component

**Files:**
- Create: `src/components/venues/VenueGridCardSkeleton.tsx`

- [ ] **Step 1: Create the skeleton shimmer component**

Create `src/components/venues/VenueGridCardSkeleton.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`

Expected: New component compiles without errors. Build may still fail on other files — that's fine.

- [ ] **Step 3: Commit skeleton component**

```bash
git add src/components/venues/VenueGridCardSkeleton.tsx
git commit -m "feat: add VenueGridCardSkeleton shimmer component

Placeholder card with pulse animation for image area, title, metadata,
and highlight lines. Used during AI scoring wait."
```

---

### Task 4: Update VenueGridCard badge positions for matched cards

**Files:**
- Modify: `src/components/venues/VenueGridCard.tsx:58-161`

- [ ] **Step 1: Update the image badges section for matched cards**

The spec says: matched cards show match ring top-right, price badge bottom-right on image, rating bottom-left on image. Currently, when `matchScore` exists, price replaces the match ring (ternary on line 81-88). We need both visible simultaneously.

In `src/components/venues/VenueGridCard.tsx`, replace the entire `{/* Badges on image */}` section and `{/* Rating on image bottom */}` section (lines 74-95) with:

```tsx
          {/* Badges on image */}
          {/* Top-left: venue type badge (always shown) */}
          <div className="absolute top-3 left-3">
            <span className="bg-om-orange/70 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {venueTypeLabel(venue.venueType)}
            </span>
          </div>

          {/* Top-right: match ring (matched) or price badge (normal) */}
          <div className="absolute top-3 right-3">
            {matchScore ? (
              <MatchScoreRing percentage={matchScore.matchPercentage} />
            ) : (
              <span className="bg-om-orange/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {formatPrice(venue.pricePerDay)}/day
              </span>
            )}
          </div>

          {/* Bottom-right: price badge (matched) or rating (normal) */}
          <div className="absolute bottom-3 right-3">
            {matchScore ? (
              <span className="bg-black/60 text-om-orange text-xs font-semibold px-2.5 py-1 rounded-lg">
                {formatPrice(venue.pricePerDay)}/day
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-om-orange text-om-orange" />
                <span className="text-sm font-medium text-white">{venue.rating}</span>
              </span>
            )}
          </div>

          {/* Bottom-left: rating (matched only) */}
          {matchScore && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-om-orange text-om-orange" />
              <span className="text-sm font-medium text-white">{venue.rating}</span>
            </div>
          )}
```

- [ ] **Step 2: Remove the inline price from the metadata row for matched cards**

In the content section below the image (around lines 102-116), the current code shows price in the metadata row when `matchScore` exists (lines 111-115). Remove that inline price since it's now on the image:

Replace the metadata `<div>` (lines 102-116) with:

```tsx
          <div className="flex items-center gap-3 mb-3" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {venue.city}
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Users className="h-3.5 w-3.5" />
              {venue.capacity}
            </span>
          </div>
```

This removes the conditional `{matchScore && <span>price</span>}` block that was showing price in two places.

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`

Expected: VenueGridCard compiles. Build may still fail on VenueGrid/MatchCriteriaPanel — that's fine.

- [ ] **Step 4: Commit VenueGridCard changes**

```bash
git add src/components/venues/VenueGridCard.tsx
git commit -m "feat: reposition matched card badges — ring top-right, price bottom-right, rating bottom-left

Matched cards now show match ring and price simultaneously on the image.
Rating moves to bottom-left. Inline price removed from metadata row."
```

---

## Chunk 3: MatchCriteriaPanel Redesign

### Task 5: Redesign MatchCriteriaPanel with multi-select pills + results grid

This is the largest task. The component changes from a collapsible form with single-select dropdowns to an always-expanded form with multi-select pill toggles that also renders matched venue results inside itself.

**Files:**
- Modify: `src/components/venues/MatchCriteriaPanel.tsx`

- [ ] **Step 1: Update the interface and imports**

Replace the entire `src/components/venues/MatchCriteriaPanel.tsx` file with:

```tsx
"use client";

import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { venueTypeLabel } from "@/lib/utils";
import VenueGridCard from "./VenueGridCard";
import VenueGridCardSkeleton from "./VenueGridCardSkeleton";
import type { MatchCriteria, Venue, VenueMatchResult } from "@/types";

const cityOptions = ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"];

const amenityOptions = [
  "wifi", "catering", "projector", "whiteboard", "breakout_rooms",
  "parking", "accessibility", "natural_light", "outdoor_space",
  "kitchen", "av_equipment", "video_conferencing",
];

const venueTypeOptions = [
  "conference_center", "meeting_room", "workshop_space",
  "unique_venue", "hotel", "coworking",
];

interface MatchCriteriaPanelProps {
  onSearch: (criteria: MatchCriteria) => void;
  onClear: () => void;
  isLoading: boolean;
  hasResults: boolean;
  matchedVenues: Array<{ venue: Venue; score: VenueMatchResult }>;
  error: string | null;
}

export default function MatchCriteriaPanel({
  onSearch,
  onClear,
  isLoading,
  hasResults,
  matchedVenues,
  error,
}: MatchCriteriaPanelProps) {
  const [capacity, setCapacity] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleVenueType = (type: string) => {
    setSelectedVenueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSearch = () => {
    const criteria: MatchCriteria = {};
    if (capacity) criteria.capacity = parseInt(capacity);
    if (budget) criteria.budget = parseInt(budget);
    if (selectedCities.length > 0) criteria.cities = selectedCities;
    if (selectedVenueTypes.length > 0) criteria.venueTypes = selectedVenueTypes;
    if (selectedAmenities.length > 0) criteria.amenities = selectedAmenities;
    if (description.trim()) criteria.description = description.trim();
    onSearch(criteria);
  };

  const handleClear = () => {
    setCapacity("");
    setBudget("");
    setSelectedCities([]);
    setSelectedVenueTypes([]);
    setSelectedAmenities([]);
    setDescription("");
    onClear();
  };

  const hasCriteria =
    capacity ||
    budget ||
    selectedCities.length > 0 ||
    selectedVenueTypes.length > 0 ||
    selectedAmenities.length > 0 ||
    description;

  return (
    <div className="glass-card p-5 mb-6" style={{ borderColor: "rgba(255,107,0,0.2)" }}>
      {/* Header — always visible, not collapsible */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-full bg-om-orange/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-om-orange" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            AI Venue Matcher
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Tell us what you need and we&apos;ll score every venue for you
          </p>
        </div>
      </div>

      {/* Criteria Form — always expanded */}
      <div className="space-y-4">
        {/* Row 1: Capacity + Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Attendees
            </label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Max budget/day (EUR)
            </label>
            <input
              type="number"
              placeholder="e.g. 2000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* City — multi-select pill toggles */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            City
          </label>
          <div className="flex flex-wrap gap-1.5">
            {cityOptions.map((c) => (
              <button
                key={c}
                onClick={() => toggleCity(c)}
                aria-pressed={selectedCities.includes(c)}
                className={
                  selectedCities.includes(c)
                    ? "glass-pill-orange px-2.5 py-1 text-xs"
                    : "glass-pill px-2.5 py-1 text-xs"
                }
                style={
                  !selectedCities.includes(c)
                    ? { color: "var(--text-secondary)" }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Venue Type — multi-select pill toggles */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Venue type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {venueTypeOptions.map((t) => (
              <button
                key={t}
                onClick={() => toggleVenueType(t)}
                aria-pressed={selectedVenueTypes.includes(t)}
                className={
                  selectedVenueTypes.includes(t)
                    ? "glass-pill-orange px-2.5 py-1 text-xs"
                    : "glass-pill px-2.5 py-1 text-xs"
                }
                style={
                  !selectedVenueTypes.includes(t)
                    ? { color: "var(--text-secondary)" }
                    : undefined
                }
              >
                {venueTypeLabel(t)}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities — multi-select pill toggles (existing pattern) */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Required amenities
          </label>
          <div className="flex flex-wrap gap-1.5">
            {amenityOptions.map((a) => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                aria-pressed={selectedAmenities.includes(a)}
                className={
                  selectedAmenities.includes(a)
                    ? "glass-pill-orange px-2.5 py-1 text-xs"
                    : "glass-pill px-2.5 py-1 text-xs"
                }
                style={
                  !selectedAmenities.includes(a)
                    ? { color: "var(--text-secondary)" }
                    : undefined
                }
              >
                {a.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
            Describe your ideal venue (optional)
          </label>
          <textarea
            placeholder="e.g. Historic venue with natural daylight for a creative workshop..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="glass-input w-full px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSearch}
            disabled={!hasCriteria || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-om-orange hover:bg-om-orange-dark text-white text-sm font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scoring venues...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Find My Match
              </>
            )}
          </button>
          {hasResults && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-full"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Results Area ─── */}
      {/* Shown during loading (skeletons), after results, or on error */}
      {(isLoading || hasResults || error) && (
        <div
          className="mt-5 pt-5"
          style={{ borderTop: "1px solid rgba(255,107,0,0.15)" }}
        >
          {/* Error state */}
          {error && !isLoading && (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
          )}

          {/* Loading state — skeleton shimmer */}
          {isLoading && (
            <>
              <div className="flex items-center gap-2.5 mb-4">
                <Loader2 className="h-4 w-4 text-om-orange animate-spin" />
                <span className="text-xs font-medium text-om-orange">
                  Scoring venues against your criteria...
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <VenueGridCardSkeleton key={i} />
                ))}
              </div>
            </>
          )}

          {/* Results — matched venue cards */}
          {!isLoading && !error && hasResults && (
            <>
              <p className="text-xs font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
                {matchedVenues.length} venue{matchedVenues.length !== 1 ? "s" : ""} matched
                {selectedCities.length > 0 && ` in ${selectedCities.join(" + ")}`}
                {" — sorted by match score"}
              </p>
              {matchedVenues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedVenues.map(({ venue, score }) => (
                    <VenueGridCard
                      key={venue.id}
                      venue={venue}
                      matchScore={score}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No venues matched your criteria. Try adjusting your filters or talk to an expert.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

Key changes from current component:
- Removed `expanded` state and `ChevronDown`/`ChevronUp` — form is always visible
- Header is no longer a toggle button
- `city` (string) → `selectedCities` (string[]) with `toggleCity` function
- `venueType` (string) → `selectedVenueTypes` (string[]) with `toggleVenueType` function
- City and venue type sections changed from `<select>` dropdowns to pill toggle buttons with `aria-pressed`
- New props: `matchedVenues`, `error`
- Results area renders below the form with a subtle `border-top`
- Loading state shows 6 `VenueGridCardSkeleton` cards
- Error state shows error message
- `Loader2` icon imported for spinner (replaces text-only loading state)
- `handleSearch` builds `cities` and `venueTypes` arrays instead of single values

- [ ] **Step 2: Verify the component compiles in isolation**

Run: `npx tsc --noEmit src/components/venues/MatchCriteriaPanel.tsx`

If that doesn't work (Next.js may require full build), run:
`npm run build`

Expected: MatchCriteriaPanel compiles. VenueGrid will fail because it doesn't pass the new props yet — that's expected.

- [ ] **Step 3: Commit MatchCriteriaPanel redesign**

```bash
git add src/components/venues/MatchCriteriaPanel.tsx
git commit -m "feat: redesign MatchCriteriaPanel — multi-select pills, results grid, skeleton loading

City and venue type use multi-select pill toggles (matching amenity pattern).
Panel is always expanded (no collapse). Results area shows skeleton shimmer
during loading, matched venue cards with scores, or error message.
New props: matchedVenues, error."
```

---

## Chunk 4: VenueGrid Restructure

### Task 6: Restructure VenueGrid — remove filters, split matched vs ruled-out

This is the orchestration task. `VenueGrid` removes its own search bar, city pills, and type pills. It passes scored venues to `MatchCriteriaPanel`, and renders ruled-out venues below a divider.

**Files:**
- Modify: `src/components/venues/VenueGrid.tsx`

- [ ] **Step 1: Rewrite VenueGrid for new architecture**

Replace the entire `src/components/venues/VenueGrid.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import VenueGridCard from "./VenueGridCard";
import MatchCriteriaPanel from "./MatchCriteriaPanel";
import ExpertCTA from "./ExpertCTA";
import type { Venue, MatchCriteria, VenueMatchResult } from "@/types";

interface VenueGridProps {
  venues: Venue[];
}

export default function VenueGrid({ venues }: VenueGridProps) {
  const [matchScores, setMatchScores] = useState<Map<string, VenueMatchResult>>(new Map());
  const [scoredVenueIds, setScoredVenueIds] = useState<Set<string>>(new Set());
  const [isScoring, setIsScoring] = useState(false);
  const [activeCriteria, setActiveCriteria] = useState<MatchCriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasResults = matchScores.size > 0;

  // Split venues into matched (scored) and ruled-out (not scored)
  const { matchedVenues, ruledOutVenues } = useMemo(() => {
    if (!hasResults) {
      return { matchedVenues: [], ruledOutVenues: [] };
    }

    const matched: Array<{ venue: Venue; score: VenueMatchResult }> = [];
    const ruledOut: Venue[] = [];

    for (const venue of venues) {
      if (scoredVenueIds.has(venue.id)) {
        const score = matchScores.get(venue.id);
        if (score) {
          matched.push({ venue, score });
        }
      } else {
        ruledOut.push(venue);
      }
    }

    // Sort matched by score descending
    matched.sort((a, b) => b.score.matchPercentage - a.score.matchPercentage);

    return { matchedVenues: matched, ruledOutVenues: ruledOut };
  }, [venues, matchScores, scoredVenueIds, hasResults]);

  const bestMatch = useMemo(() => {
    if (matchScores.size === 0) return 100;
    const scores = Array.from(matchScores.values());
    return Math.max(...scores.map((s) => s.matchPercentage));
  }, [matchScores]);

  const handleMatchSearch = async (criteria: MatchCriteria) => {
    setIsScoring(true);
    setActiveCriteria(criteria);
    setError(null);
    try {
      const res = await fetch("/api/venues/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to score venues");
      }
      if (data.scores) {
        const scoreMap = new Map<string, VenueMatchResult>();
        for (const score of data.scores) {
          scoreMap.set(score.venueId, score);
        }
        setMatchScores(scoreMap);
        setScoredVenueIds(new Set(data.scoredVenueIds || []));
      }
    } catch {
      setError("Something went wrong scoring venues. Please try again.");
      setMatchScores(new Map());
      setScoredVenueIds(new Set());
    } finally {
      setIsScoring(false);
    }
  };

  const handleClearMatch = () => {
    setMatchScores(new Map());
    setScoredVenueIds(new Set());
    setActiveCriteria(null);
    setError(null);
  };

  return (
    <div>
      {/* AI Venue Matcher — the single entry point for filtering and scoring */}
      <MatchCriteriaPanel
        onSearch={handleMatchSearch}
        onClear={handleClearMatch}
        isLoading={isScoring}
        hasResults={hasResults}
        matchedVenues={matchedVenues}
        error={error}
      />

      {/* Before matching: show all venues in a flat grid */}
      {!hasResults && !isScoring && (
        <>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {venues.length} venue{venues.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>
        </>
      )}

      {/* After matching: show ruled-out venues below a divider */}
      {hasResults && ruledOutVenues.length > 0 && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Other Venues
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
          </div>

          {/* Ruled-out venue grid — dimmed */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ opacity: 0.7 }}
          >
            {ruledOutVenues.map((venue) => (
              <VenueGridCard key={venue.id} venue={venue} />
            ))}
          </div>
        </>
      )}

      {/* Expert CTA — show when best match score < 70% */}
      {hasResults && bestMatch < 70 && (
        <div className="mt-8">
          <ExpertCTA criteria={activeCriteria || undefined} />
        </div>
      )}
    </div>
  );
}
```

Key changes from current component:
- Removed all imports: `Search`, `venueTypeLabel`
- Removed all filter state: `city`, `type`, `search`
- Removed `filtered` useMemo that applied search/city/type filters
- Removed the search input, city pills, and type pills JSX sections
- Removed `initialCity` and `initialType` props from `VenueGridProps`
- Added `scoredVenueIds` state (Set) to track which venues were scored
- Added `error` state for API error handling
- New `matchedVenues` / `ruledOutVenues` split logic using `scoredVenueIds`
- Passes `matchedVenues` and `error` as new props to `MatchCriteriaPanel`
- Before matching: shows all venues in flat grid (no filters)
- After matching: shows ruled-out venues below a "Other Venues" divider at ~70% opacity
- ExpertCTA only shows when `hasResults && bestMatch < 70` (was incorrectly showing when `matchScores.size > 0`)
- Error handling: on API failure, sets error message and clears scores

- [ ] **Step 2: Update `src/app/venues/page.tsx` — remove searchParams and dead props**

The parent page currently destructures `searchParams` to extract `city` and `type`, then passes them as `initialCity`/`initialType`. Both props are removed from `VenueGrid`, so this code is now dead. Replace the entire file:

```tsx
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
```

Changes from current file:
- Removed `searchParams` parameter and its type annotation from `VenuesPage`
- Removed `const params = await searchParams;`
- Removed `initialCity={params.city}` and `initialType={params.type}` props from `<VenueGrid>`

- [ ] **Step 3: Run the full build to verify everything compiles**

Run: `npm run build`

Expected: Full build passes. All TypeScript types align, all components compile.

- [ ] **Step 4: Commit VenueGrid restructure and page.tsx update**

```bash
git add src/components/venues/VenueGrid.tsx src/app/venues/page.tsx
git commit -m "feat: restructure VenueGrid — remove filters, split matched vs ruled-out

AI Venue Matcher is now the single entry point. Search bar, city pills,
and type pills removed. After scoring: matched venues shown inside
MatchCriteriaPanel, ruled-out venues shown below divider at 70% opacity.
Error handling added for API failures. Removed searchParams/initialCity/
initialType from venues page."
```

---

## Chunk 5: Visual Verification + Final Build

### Task 7: Full build verification and visual check

**Files:**
- All modified files from previous tasks

- [ ] **Step 1: Run the complete build**

```bash
npm run build
```

Expected: Clean build with no TypeScript errors or warnings.

- [ ] **Step 2: Run the linter**

```bash
npm run lint
```

Expected: No lint errors. Fix any that appear.

- [ ] **Step 3: Start the dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:3000/venues` in a browser and verify:

1. **Initial state:** AI Venue Matcher card is expanded at top, showing all criteria fields (attendees, budget, city pills, venue type pills, amenities pills, description textarea). All venues displayed in a flat grid below. No search bar, no standalone city/type pills.

2. **Select criteria and click "Find My Match":** Button shows spinner + "Scoring venues..." text. Skeleton shimmer cards appear inside the matcher card (6 cards, responsive grid). After scoring completes, matched venues appear with match rings (top-right), price badges (bottom-right on image), ratings (bottom-left on image), highlights, and missing requirements.

3. **Ruled-out venues:** Below the matcher card, a centered "Other Venues" divider separates ruled-out venues. These venues are displayed at ~70% opacity with normal card layout (no match scores).

4. **Clear button:** Clicking "Clear" resets all fields and returns to the initial flat grid.

5. **Error handling:** To test, temporarily break the API (e.g., disconnect network), click "Find My Match" — should show error message in results area, button returns to normal.

6. **Multi-select:** Can select multiple cities (e.g., Amsterdam + Rotterdam), multiple venue types, multiple amenities simultaneously. All use the same orange pill toggle pattern.

- [ ] **Step 4: Fix any visual issues discovered**

Address any CSS or layout issues found during visual verification.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: polish visual details from manual verification"
```
