# AI Venue Finder Conversational Chat — Design Document

**Date:** 2026-03-12
**Status:** Approved

## Summary

Transform the AI Venue Finder (home page ChatInterface) into a full conversational AI experience where the AI guides users through venue discovery, scoring, and booking. Demo scenarios use AI-generated suggestion prompts (not scripted) steered by hidden system prompt context. Add file upload (images/PDFs), URL extraction, inline venue expansion, and match scoring.

## Requirements

1. **Interactive conversational AI** — full chat context before every reply, AI guides and suggests
2. **File/media extraction** — `+` button next to input for image/PDF upload; AI analyzes content via Vision API and PDF parsing
3. **URL extraction** — AI can fetch and parse URLs shared in chat
4. **Scored venue suggestions** — venue cards show match percentage with color coding, highlights, and missing requirements
5. **Inline venue expansion** — click venue card to expand details (photos, amenities, pricing) within chat
6. **AI-generated demo suggestions** — no scripted follow-ups; AI generates suggestion buttons that steer toward scenario outcomes
7. **Two demo scenarios:**
   - `perfectMatch`: suggestions lead to criteria matching high-scoring Amsterdam venues (85%+)
   - `expertCta`: suggestions lead to niche/impossible criteria, low scores (<60%), triggering Expert CTA
8. **No auto-send** — suggestion buttons populate input field; user can edit before sending
9. **Venue data expansion** — grow from ~30 to 50-60 Dutch venues with strategic parameter diversity
10. **Everything stays on the home page** — no new routes

## Approach

**Context-Enriched System Prompt (Approach A):** Pass the active demo scenario as hidden context in the system prompt. The AI uses its intelligence to generate suggestion prompts that naturally converge on the intended outcome. Nothing is scripted.

## Architecture

### Demo Scenario System

**Remove:** Hardcoded `demoScenarios.followUps`, `demoTurnRef`, auto-reply logic.

**Keep:** Demo scenario buttons (`perfectMatch` and `expertCta`).

**New behavior:**
1. User clicks demo button → sends scenario type as `demoScenario` param with first API call
2. API injects scenario-specific system prompt additions
3. AI generates opening message + suggestion buttons via `suggest_options` tool
4. User clicks suggestion → populates input (not auto-sent) → user sends
5. AI responds with full context awareness, generates new suggestions
6. Loop continues until scenario resolves naturally

**System prompt injections:**

- `perfectMatch`: "Guide user toward Amsterdam conference/retreat venue for 30-50 people, budget EUR 3,000-5,000/day. Generate suggestions that refine toward these criteria. Venues matching this exist and will score 85%+."
- `expertCta`: "Guide user toward highly specific luxury venue (historic castle, Michelin chef, helicopter access). Generate suggestions that push toward niche requirements. Searches will return low scores (<60%). After 2-3 low-score searches, recommend connecting with OneMeeting venue specialist."

### Chat Intelligence

- Full conversation history sent with every request (already implemented)
- AI generates 2-3 contextual suggestion buttons per response via `suggest_options` tool
- System prompt enhanced to emphasize conversation context awareness
- Suggestion buttons: click fills input, does not send

### Scored Venue Results

- `search_venues` → `scoreVenueMatches()` pipeline (already exists)
- Venue cards in chat show: match %, highlights, missing requirements
- Color coding: Green 80%+, Orange 60-79%, Red <60%
- Click to expand: carousel photos, full amenities, room layouts, pricing, "Ask about this venue" button

### File Upload

**UI:**
- `+` button left of input field
- Popover with "Upload Image" and "Upload PDF" options
- File previews as dismissible pills above input
- Multiple attachments per message supported

**Processing:**
- **Images:** Base64-encoded, sent as OpenAI Vision content parts in the message
- **PDFs:** Server-side parsing with `pdf-parse`, extracted text included as context
- **URLs:** New `extract_url_content` tool fetches and parses page content

### Venue Data Expansion

**Target:** 50-60 venues across 5 Dutch cities (10-12 per city)

**Diversity:**
- Price: Budget (EUR 500-1,500), Mid (EUR 1,500-4,000), Premium (EUR 4,000-10,000)
- Capacity: Small (10-30), Medium (30-100), Large (100-500)
- Types: Every city has all 6 venue types
- Amenities: Deliberate gaps for meaningful score differentiation

**Demo reliability:**
- 2-3 Amsterdam conference centers with capacity 30-50, price EUR 3k-5k, full amenities → perfectMatch targets
- No venues with castle+Michelin+helicopter combo → expertCta guarantees low scores

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatInterface.tsx` | Remove auto-reply, add upload button, inline expansion, suggestion-fills-input behavior |
| `src/app/api/chat/route.ts` | Accept demoScenario param, inject system prompts, handle file attachments, add URL tool |
| `src/lib/venue-tools.ts` | Add `extract_url_content` tool, enhance `suggest_options` description |
| `src/components/chat/ChatMessage.tsx` | Add attachment display, inline venue expansion |
| `src/components/chat/VenueCard.tsx` | Add expandable detail view |
| `src/types/index.ts` | Add attachment types to ChatMessage |
| `prisma/seed.ts` | Expand to 50-60 venues with strategic parameters |

## New Dependencies

- `pdf-parse`: Server-side PDF text extraction

## Success Criteria

1. Demo `perfectMatch` scenario: AI-generated suggestions lead to venue search with 85%+ match within 3-4 exchanges
2. Demo `expertCta` scenario: AI-generated suggestions lead to low scores and Expert CTA within 3-4 exchanges
3. File upload works: user uploads event brief PDF, AI extracts requirements and searches
4. URL extraction works: user pastes venue URL, AI analyzes content
5. No auto-sending of messages — user always controls when to send
6. Every demo run feels different (non-scripted suggestions)
