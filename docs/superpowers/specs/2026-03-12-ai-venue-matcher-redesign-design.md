# AI Venue Matcher Redesign — Browse Venues Page

**Date:** 2026-03-12
**Status:** Approved

## Overview

Redesign the Browse Venues page so the AI Venue Matcher becomes the single entry point for all venue filtering and scoring. The matcher card owns all criteria inputs (attendees, budget, cities, venue types, amenities, description), displays matched results inside itself, and separates ruled-out venues below a divider.

## Page Structure

### Before matching (initial load)

1. **AI Venue Matcher card** — expanded, showing criteria form with empty fields
2. **All venues** — flat grid below the matcher card, normal display (price badge top-right, amenity tags, no scores)

No search bar, no city pills, no type pills outside the matcher. The matcher IS the filter.

### After "Find My Match"

1. **AI Venue Matcher card** — criteria form collapses or stays visible, results area appears below the form inside the card:
   - Skeleton shimmer placeholder cards during the 5-10 second scoring wait
   - Once scores arrive: matched venue cards with match rings, highlights, price badges
   - Status line: "6 venues matched in Amsterdam + Rotterdam — sorted by match score"
2. **Divider** — centered label: "Other Venues"
3. **Ruled-out venues** — venues that failed hard criteria (wrong city, over budget, wrong type). Shown slightly dimmed (opacity ~0.7), normal card display, no match scores

### "Clear" button

Resets to initial state: all venues in flat grid, no scores, no divider.

## AI Venue Matcher Card

### Criteria Form

All inputs live inside the matcher card:

| Field | Type | Details |
|---|---|---|
| Attendees | Number input | e.g. 50 |
| Max budget/day | Number input | e.g. 2000 (EUR) |
| City | Multi-select pill toggles | Amsterdam, Rotterdam, Utrecht, The Hague, Eindhoven. User can select multiple. |
| Venue type | Multi-select pill toggles | Conference Center, Meeting Room, Workshop Space, Unique Venue, Hotel, Co-working. User can select multiple. |
| Required amenities | Multi-select pill toggles | wifi, catering, projector, whiteboard, breakout_rooms, parking, accessibility, natural_light, outdoor_space, kitchen, av_equipment, video_conferencing |
| Description | Textarea (optional) | Free-text description of ideal venue |

City and venue type change from single-select dropdowns to multi-select pill toggles, matching the existing amenity pill interaction pattern. All three pill groups use the same orange-highlighted toggle style.

### Actions

- **"Find My Match" button** — disabled until at least one criterion is set. Shows spinner + "Scoring venues..." during API call.
- **"Clear" button** — visible when results exist. Resets all fields and clears scores.

### Matched Results Area

Appears inside the matcher card below the form, separated by a subtle border-top.

- Status line shows count + selected criteria summary
- 3-column grid of venue cards with match scores
- Cards show: venue type badge (top-left), match ring (top-right), price badge (bottom-right on image), rating (bottom-left on image), name, city, capacity, match highlights, missing requirements

## Loading State

Skeleton shimmer cards:

- When "Find My Match" is clicked, the results area inside the matcher card shows **6 skeleton placeholder cards** (filling 2 rows of the 3-column grid) with a subtle shimmer/pulse animation
- Placeholder cards mimic the final card layout (image area, title area, metadata area) but rendered as grey shimmer blocks
- Button text changes to spinner + "Scoring venues..."
- Once API returns, skeleton cards are replaced with actual scored venue cards
- Grid is responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (same breakpoints as the current venue grid)

### Error State

If the `/api/venues/match` API call fails:
- Skeleton cards are removed
- An error message appears in the results area: "Something went wrong scoring venues. Please try again."
- The "Find My Match" button reverts to its default state (not loading) so the user can retry
- The pre-match venue grid below is not affected

## Venue Card Layout (Matched)

On the image overlay:
- **Top-left:** Venue type badge (orange pill)
- **Top-right:** Match percentage ring (SVG circle, color-coded: green ≥80%, orange ≥60%, yellow <60%)
- **Bottom-right:** Price badge (dark background, orange text, e.g. "€1,200/day")
- **Bottom-left:** Rating (star + number)

Below the image:
- Venue name
- City + capacity metadata
- Up to 2-3 match highlights (green checkmark) and missing requirements (yellow warning)

## Venue Card Layout (Normal / Ruled-out)

Same as current non-matched cards:
- **Top-left:** Venue type badge
- **Top-right:** Price badge
- **Bottom-right:** Rating
- Below: name, city, capacity, amenity tags

Ruled-out cards rendered at ~70% opacity to visually distinguish them from matched results.

## Other Venues Section

Positioned below the matcher card, separated by a centered divider:

```
────────── Other Venues ──────────
```

Shows all venues that were ruled out by the AI's hard criteria filtering (wrong city, over budget, wrong venue type). No additional search or filter controls — these are simply the remainder.

## Type Changes

### `MatchCriteria` (src/types/index.ts)

```typescript
interface MatchCriteria {
  cities?: string[];       // was: city?: string
  capacity?: number;
  budget?: number;
  amenities?: string[];
  venueTypes?: string[];   // was: venueType?: string
  meetingType?: string;
  roomLayout?: string;
  catering?: boolean;
  description?: string;
}
```

Key changes:
- `city?: string` → `cities?: string[]` (multi-select)
- `venueType?: string` → `venueTypes?: string[]` (multi-select)
- `meetingType`, `roomLayout`, and `catering` fields are retained for other consumers (e.g. AI Venue Finder chat) but are NOT part of the Browse Venues matcher form

### API Route (`/api/venues/match`)

Update pre-filter logic:
- City filter: `venues.filter(v => criteria.cities?.some(c => c.toLowerCase() === v.city.toLowerCase()))` — case-insensitive, matching current behavior
- Venue type filter: `venues.filter(v => criteria.venueTypes?.includes(v.venueType))` instead of single type match
- Keep the existing soft-match logic (currently sends up to 10 pre-filtered + 3 soft-match venues to the AI scorer). Soft matches are venues that partially miss criteria (e.g. slightly over budget, different city) — they still get scored but will have lower match percentages.

**Updated response shape:**

```typescript
// Response from /api/venues/match
{
  scores: VenueMatchResult[];   // scored venues (matched + soft matches)
  scoredVenueIds: string[];     // IDs of all venues that were scored
}
```

The frontend uses `scoredVenueIds` to split venues: any venue whose ID is in `scoredVenueIds` is "matched" (shown inside the matcher card with its score). All other venues are "ruled-out" (shown below the divider). This avoids changing `VenueMatchResult` and keeps the split logic simple.

## Component Changes

### `MatchCriteriaPanel`

- Replace city dropdown with multi-select pill toggles (same interaction as amenities). Add `aria-pressed` for accessibility.
- Replace venue type dropdown with multi-select pill toggles. Add `aria-pressed` for accessibility.
- State changes: `city: string` → `selectedCities: string[]`, `venueType: string` → `selectedVenueTypes: string[]`
- Form sends `cities` and `venueTypes` arrays in criteria
- Default `expanded` state changes from `false` to `true` (matcher is always visible on initial load)
- **New prop:** `matchedVenues` — receives the scored venue data to render the matched results grid inside the card
- **New prop:** `isLoading` — already exists, controls skeleton shimmer display in results area
- **New prop:** `error` — displays error message in results area when API fails

This component now owns two areas: (1) the criteria form, and (2) the matched results grid below it. This keeps the matcher card self-contained.

### `VenueGrid`

- Remove the search bar, city pills, and venue type pills that currently sit above the grid
- Passes scored venues and loading/error state down to `MatchCriteriaPanel`
- After scoring: renders only the ruled-out venues (those NOT in `scoredVenueIds`) below the divider, dimmed
- Before scoring (initial load): show all venues in a single flat grid below the matcher
- `ExpertCTA` component stays at the bottom, shown when best match score < 70% (same trigger as current)

### `VenueGridCard`

- When `matchScore` exists: show match ring top-right, price badge bottom-right on image, highlights in content
- Price badge position change: currently price is hidden from image when matched (match ring replaces it). New behavior: match ring top-right, price badge bottom-right on image (both visible). Remove the inline price from the metadata row for matched cards (avoid showing price in two places).
- Rating moves to bottom-left on image (from current bottom-right) to make room for price bottom-right

### Skeleton Card Component (new)

- New `VenueGridCardSkeleton` component
- Mimics card layout with animated shimmer blocks (image area, title line, metadata line, 2 highlight lines)
- Used in results area inside `MatchCriteriaPanel` during scoring
- Renders 6 skeleton cards by default (2 rows in the 3-column grid)

## Decisions

- **AI Venue Matcher is the single input** — no duplicate filters elsewhere on the page
- **Multi-select for city and venue type** — users can search across multiple locations and types simultaneously
- **Skeleton shimmer for loading** — simple, familiar pattern. No scanning effect.
- **Ruled-out venues shown below divider** — slightly dimmed, still browsable, clearly separated from AI matches
- **AI Venue Finder (chat on homepage) stays separate** — will discuss integration later
