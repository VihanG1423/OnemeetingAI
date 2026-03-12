# AI Venue Finder Conversational Chat — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the AI Venue Finder into a full conversational AI with AI-generated demo suggestions, file upload, scored inline venue cards, and expanded venue data.

**Architecture:** Context-enriched system prompts steer demo scenarios (no scripted follow-ups). File uploads processed via OpenAI Vision (images) and pdf-parse (PDFs). A new `extract_url_content` tool handles URL extraction. Suggestion buttons populate input without auto-sending.

**Tech Stack:** Next.js 16, React 19, OpenAI gpt-4o-mini (with Vision), Prisma/SQLite, pdf-parse, Tailwind CSS v4, lucide-react

---

### Task 1: Add Types for File Attachments

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add attachment type and update ChatMessage interface**

In `src/types/index.ts`, add a new `ChatAttachment` interface and update `ChatMessage`:

```typescript
// Add after BookingDraftData interface (line 119)
export interface ChatAttachment {
  id: string;
  type: "image" | "pdf";
  name: string;
  size: number; // bytes
  preview?: string; // base64 data URL for image thumbnails
  data: string; // base64 content (image) or extracted text (pdf)
}
```

Update the `ChatMessage` interface to add attachments field:

```typescript
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  venues?: VenueCardData[];
  bookingDraft?: BookingDraftData;
  suggestions?: string[];
  isStreaming?: boolean;
  attachments?: ChatAttachment[]; // NEW
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add ChatAttachment type for file upload support"
```

---

### Task 2: Install pdf-parse Dependency

**Step 1: Install pdf-parse**

```bash
npm install pdf-parse
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pdf-parse dependency for PDF text extraction"
```

---

### Task 3: Add URL Extraction Tool & Demo System Prompts

**Files:**
- Modify: `src/lib/venue-tools.ts`

**Step 1: Add demo scenario system prompt constants**

Add after the `SYSTEM_PROMPT` export (after line 47):

```typescript
export const DEMO_PROMPTS: Record<string, string> = {
  perfectMatch: `
DEMO MODE — PERFECT MATCH SCENARIO:
You are running a guided demo showing how OneMeeting AI finds the perfect venue. Your goal is to guide the user toward finding a conference or retreat venue in Amsterdam for 30-50 people with a budget around €3,000-5,000/day.

CRITICAL RULES FOR SUGGESTION GENERATION:
- Generate suggestion prompts that naturally guide the user to specify these criteria step by step
- Start by asking about their event type and group size, then location, then budget, then specific needs
- Your suggestions should REFINE criteria toward the target, not change direction
- When you search, venues matching these criteria exist in the database and WILL score 85%+
- After finding great matches, suggest checking availability and starting a booking
- Keep the experience feeling natural and helpful — the user should feel like they discovered the perfect venue themselves
- Do NOT reveal that this is a scripted demo — act naturally
- After presenting venues with high scores (85%+), suggest next steps like checking dates or starting a booking`,

  expertCta: `
DEMO MODE — EXPERT REFERRAL SCENARIO:
You are running a guided demo showing when OneMeeting's expert network is valuable. Your goal is to guide the user toward looking for a highly specific, luxury, or unusual venue that our standard database cannot satisfy.

CRITICAL RULES FOR SUGGESTION GENERATION:
- Generate suggestion prompts that push the user toward increasingly niche, premium, or exotic requirements
- Suggest things like: historic castles, Michelin-star on-site chefs, helicopter landing pads, vineyard settings, diplomatic-grade security, multilingual concierge staff
- When searches return results, they should naturally have LOW match scores (<60%) because no standard venue can meet these ultra-specific demands
- After 2-3 searches with low scores, naturally recommend connecting with OneMeeting's venue specialists
- Frame the expert referral as a positive: "Our specialists have exclusive access to premium venues and can arrange exactly what you need"
- Do NOT reveal this is a demo — act as if genuinely trying to help
- Make the conversation feel like a natural progression from "let me search" to "I think our specialists would be better suited for this"`,
};
```

**Step 2: Add extract_url_content tool definition**

Add to the `venueTools` array (after the `suggest_options` tool definition, before the closing `]`):

```typescript
  {
    type: "function",
    function: {
      name: "extract_url_content",
      description:
        "Fetch and extract text content from a URL that the user has shared. Use this to analyze web pages, venue listings, event briefs, or any online content the user references. Returns the main text content of the page.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL to fetch and extract content from",
          },
        },
        required: ["url"],
      },
    },
  },
```

**Step 3: Add extractUrlContent function implementation**

Add after `createBookingDraft` function (after line 282):

```typescript
async function extractUrlContent(args: Record<string, unknown>) {
  const url = args.url as string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "OneMeeting-AI/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { error: `Failed to fetch URL: ${response.status}` };
    const html = await response.text();
    // Strip HTML tags, scripts, styles — extract text content
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000); // Limit to 5000 chars
    return { url, content: text };
  } catch {
    return { error: "Failed to fetch URL content" };
  }
}
```

**Step 4: Add to executeVenueTool switch**

Add a new case in `executeVenueTool` (in the switch statement, before `default`):

```typescript
    case "extract_url_content":
      return JSON.stringify(await extractUrlContent(args));
```

**Step 5: Enhance suggest_options tool description**

Update the `suggest_options` tool description (replace the current description at line 170):

```typescript
      description:
        "Show clickable quick-reply suggestion buttons to the user. ALWAYS call this after every response. Provide 3-5 contextually relevant suggestions. IMPORTANT: Analyze the full conversation context before generating suggestions. Each suggestion should advance the conversation — help the user refine criteria, explore a venue, check availability, or take a next step. Never repeat suggestions already used. Make them specific and actionable.",
```

**Step 6: Commit**

```bash
git add src/lib/venue-tools.ts
git commit -m "feat: add demo system prompts, URL extraction tool, and enhanced suggestions"
```

---

### Task 4: Update Chat API Route for Demo Mode & File Attachments

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Step 1: Add pdf-parse import and update request handling**

Replace the entire file with the updated version. Key changes:
1. Accept `demoScenario` and `attachments` in request body
2. Inject demo system prompt when active
3. Handle image attachments as OpenAI Vision content parts
4. Handle PDF text as context in user messages
5. Handle `extract_url_content` tool execution

At the top of the file, add:

```typescript
import { DEMO_PROMPTS } from "@/lib/venue-tools";
```

**Step 2: Update the POST handler to accept new params**

Change line 6 from:
```typescript
const { messages } = await request.json();
```
To:
```typescript
const { messages, demoScenario, attachments } = await request.json();
```

**Step 3: Inject demo system prompt**

Change lines 8-9 from:
```typescript
const systemMessage = { role: "system" as const, content: SYSTEM_PROMPT };
const conversationMessages = [systemMessage, ...messages];
```
To:
```typescript
let systemContent = SYSTEM_PROMPT;
if (demoScenario && DEMO_PROMPTS[demoScenario]) {
  systemContent += "\n\n" + DEMO_PROMPTS[demoScenario];
}
const systemMessage = { role: "system" as const, content: systemContent };

// Build conversation messages, handling attachments on the last user message
const conversationMessages = [systemMessage, ...messages.map((m: { role: string; content: string }, i: number) => {
  // If this is the last message and it's from the user, check for attachments
  if (i === messages.length - 1 && m.role === "user" && attachments && attachments.length > 0) {
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: m.content }
    ];

    for (const att of attachments) {
      if (att.type === "image") {
        contentParts.push({
          type: "image_url",
          image_url: { url: att.data } // base64 data URL
        });
      } else if (att.type === "pdf") {
        contentParts.push({
          type: "text",
          text: `[Attached PDF: "${att.name}"]\n${att.data}` // extracted text
        });
      }
    }

    return { role: m.role, content: contentParts };
  }
  return m;
})];
```

**Step 4: Add extract_url_content tool handling in the tool execution loop**

After the `suggest_options` handling block (after line 191), add:

```typescript
              if (tc.name === "extract_url_content") {
                // No special client-side handling needed — result goes back to AI
              }
```

**Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add demo mode injection and file attachment handling to chat API"
```

---

### Task 5: Create PDF Parse API Route

**Files:**
- Create: `src/app/api/parse-pdf/route.ts`

Since pdf-parse uses Node.js APIs (fs, Buffer) that don't work directly with browser uploads, create a simple API route that accepts a base64 PDF and returns extracted text.

**Step 1: Create the route**

```typescript
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function POST(request: Request) {
  try {
    const { base64Data, fileName } = await request.json();

    if (!base64Data) {
      return Response.json({ error: "No PDF data provided" }, { status: 400 });
    }

    // Convert base64 to Buffer
    const pdfBuffer = Buffer.from(base64Data, "base64");
    const data = await pdf(pdfBuffer);

    // Return extracted text (limit to 10000 chars for context window)
    return Response.json({
      text: data.text.slice(0, 10000),
      pages: data.numpages,
      fileName,
    });
  } catch {
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/parse-pdf/route.ts
git commit -m "feat: add PDF parsing API route"
```

---

### Task 6: Update ChatInterface — Remove Auto-Reply, Add Upload, Change Suggestion Behavior

**Files:**
- Modify: `src/components/chat/ChatInterface.tsx`

This is the largest change. Key modifications:

**Step 1: Update imports**

Add to the lucide-react import:
```typescript
import { Send, Sparkles, Zap, ChevronDown, ChevronUp, Plus, Image as ImageIcon, FileText, X } from "lucide-react";
```

Add the attachment type import:
```typescript
import type { ChatMessage as ChatMessageType, VenueCardData, BookingDraftData, ChatAttachment } from "@/types";
```

**Step 2: Simplify demo scenarios — remove followUps**

Replace the `demoScenarios` object (lines 81-99) with:

```typescript
const demoScenarios = {
  perfectMatch: {
    label: "Perfect Venue",
    description: "AI finds ideal venues",
    initialMessage: "Hi! I'm planning a corporate event and I need help finding the right venue. Can you help me?",
  },
  expertCta: {
    label: "Live Agent",
    description: "Extended hospitality demo",
    initialMessage: "Hello, I'm looking for something very special and unique for an important event. Can you help me find the perfect venue?",
  },
};
```

**Step 3: Remove auto-reply helper function**

Delete the `getFinderAutoReply` function (lines 101-112) entirely.

**Step 4: Add file upload state**

Add after existing state declarations (after line 120):

```typescript
const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
const [showUploadMenu, setShowUploadMenu] = useState(false);
const [activeDemoScenario, setActiveDemoScenario] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const uploadMenuRef = useRef<HTMLDivElement>(null);
```

**Step 5: Remove auto-reply refs and effect**

Delete `demoTurnRef` (line 121), `autoReplyTriggeredRef` (line 122), and `sendMessageRef` ref (line 126).

Delete the entire auto-reply `useEffect` block (lines 153-182).

Delete the `sendMessageRef.current = sendMessage;` line (line 357).

**Step 6: Add file handling functions**

Add after the `resizeTextarea` callback:

```typescript
const handleFileSelect = useCallback(async (accept: string) => {
  setShowUploadMenu(false);
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.multiple = true;
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const id = Date.now().toString() + Math.random().toString(36).slice(2);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setPendingAttachments(prev => [...prev, {
            id,
            type: "image",
            name: file.name,
            size: file.size,
            preview: dataUrl,
            data: dataUrl,
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        // Read as base64 and send to parse API
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const res = await fetch("/api/parse-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64Data: base64, fileName: file.name }),
            });
            const data = await res.json();
            setPendingAttachments(prev => [...prev, {
              id,
              type: "pdf",
              name: file.name,
              size: file.size,
              data: data.text || "Could not extract text from PDF",
            }]);
          } catch {
            setPendingAttachments(prev => [...prev, {
              id,
              type: "pdf",
              name: file.name,
              size: file.size,
              data: "Failed to parse PDF",
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };
  input.click();
}, []);

const removeAttachment = useCallback((id: string) => {
  setPendingAttachments(prev => prev.filter(a => a.id !== id));
}, []);

// Close upload menu when clicking outside
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
      setShowUploadMenu(false);
    }
  };
  if (showUploadMenu) document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showUploadMenu]);
```

**Step 7: Update sendMessage to include attachments and demo scenario**

Replace the `sendMessage` function. Key changes:
- Include attachments in user message
- Send `demoScenario` param to API
- Clear pending attachments after sending

```typescript
const sendMessage = async (content: string) => {
  if (!content.trim() || isLoading) return;

  const userMessage: ChatMessageType = {
    id: Date.now().toString(),
    role: "user",
    content: content.trim(),
    attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
  };

  const assistantMessage: ChatMessageType = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: "",
    isStreaming: true,
  };

  setMessages((prev) => [...prev, userMessage, assistantMessage]);
  setInput("");
  setPendingAttachments([]);
  setIsLoading(true);

  try {
    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages,
        demoScenario: activeDemoScenario,
        attachments: userMessage.attachments?.map(a => ({
          type: a.type,
          name: a.name,
          data: a.data,
        })),
      }),
    });

    // ... rest of streaming handling stays the same (lines 217-353)
```

**Step 8: Update startDemo function**

Replace the `startDemo` function:

```typescript
const startDemo = (scenarioKey: string) => {
  const scenario = demoScenarios[scenarioKey as keyof typeof demoScenarios];
  if (!scenario) return;
  setActiveDemoScenario(scenarioKey);
  setActiveDemo(scenarioKey);
  setDemoFinished(null);
  sendMessage(scenario.initialMessage);
};
```

**Step 9: Change suggestion buttons to fill input instead of auto-sending**

Find the suggestion buttons render (line 475 area) and change `onClick`:

```typescript
onClick={() => setInput(s)}
```

Instead of:
```typescript
onClick={() => sendMessage(s)}
```

**Step 10: Also change sample prompts to fill input**

Find the sample prompts button onClick (line 454) and change similarly:

```typescript
onClick={() => setInput(s)}
```

**Step 11: Add upload button and attachment preview to input area**

Replace the input area (lines 497-518) with:

```tsx
{/* Input area */}
<div className="border-t border-white/10 p-4">
  {/* Pending attachments preview */}
  {pendingAttachments.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-3">
      {pendingAttachments.map(att => (
        <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
          {att.type === "image" ? (
            <ImageIcon className="h-3.5 w-3.5 text-om-orange" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-om-orange" />
          )}
          <span className="text-white/70 max-w-[150px] truncate">{att.name}</span>
          <button
            type="button"
            onClick={() => removeAttachment(att.id)}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )}
  <form onSubmit={handleSubmit} className="flex items-end gap-2">
    {/* Upload button */}
    <div className="relative" ref={uploadMenuRef}>
      <button
        type="button"
        onClick={() => setShowUploadMenu(v => !v)}
        className="p-3 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0 self-end"
        title="Attach file"
      >
        <Plus className="h-4 w-4" />
      </button>
      {showUploadMenu && (
        <div className="absolute bottom-full left-0 mb-2 py-1 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl min-w-[160px] animate-fade-in-up">
          <button
            type="button"
            onClick={() => handleFileSelect("image/*")}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ImageIcon className="h-4 w-4 text-om-orange" />
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => handleFileSelect(".pdf")}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FileText className="h-4 w-4 text-om-orange" />
            Upload PDF
          </button>
        </div>
      )}
    </div>
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Describe your ideal meeting venue..."
      rows={1}
      className="glass-input flex-1 px-4 py-3 text-sm resize-none overflow-hidden"
      style={{ minHeight: "44px" }}
      disabled={isLoading}
    />
    <button
      type="submit"
      disabled={isLoading || !input.trim()}
      className="bg-om-orange hover:bg-om-orange-dark disabled:opacity-40 text-white px-4 py-3 rounded-xl transition-colors shrink-0 self-end"
    >
      <Send className="h-4 w-4" />
    </button>
  </form>
</div>
```

**Step 12: Update demo banner text**

Update the demo banner to not say "Auto Demo":

```tsx
<span className="text-xs font-medium text-om-orange">
  Demo: {demoScenarios[activeDemo as keyof typeof demoScenarios]?.label}
</span>
```

**Step 13: Commit**

```bash
git add src/components/chat/ChatInterface.tsx
git commit -m "feat: conversational AI chat — upload, no auto-send, AI-driven demos"
```

---

### Task 7: Update ChatMessage to Show Attachments

**Files:**
- Modify: `src/components/chat/ChatMessage.tsx`

**Step 1: Add attachment display in user messages**

Add after the import statements:
```typescript
import { Bot, User, ImageIcon, FileText } from "lucide-react";
```

Wait — `ImageIcon` comes from lucide-react as `Image`. Update import:
```typescript
import { Bot, User, Image as ImageIcon, FileText } from "lucide-react";
```

In the ChatMessage component, after the message content `<div>` and before the venue cards section, add:

```tsx
{/* Attachments */}
{isUser && message.attachments && message.attachments.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-1">
    {message.attachments.map(att => (
      <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px]">
        {att.type === "image" ? (
          <ImageIcon className="h-3 w-3 text-om-orange" />
        ) : (
          <FileText className="h-3 w-3 text-om-orange" />
        )}
        <span className="text-white/60 max-w-[120px] truncate">{att.name}</span>
      </div>
    ))}
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/components/chat/ChatMessage.tsx
git commit -m "feat: display file attachment pills in chat messages"
```

---

### Task 8: Add Expandable Venue Cards

**Files:**
- Modify: `src/components/chat/VenueCard.tsx`

**Step 1: Make VenueCard expandable with inline details**

Replace the entire VenueCard component. Key changes:
- Remove `<Link>` wrapper — card is no longer a navigation link
- Add `expanded` state toggle on click
- When expanded: show full details (amenities, room layouts, pricing, missing requirements)
- Add "Ask about this venue" button that calls a callback
- Add "View full page" link

Update the component to accept an `onAskAbout` prop:

```typescript
interface VenueCardProps {
  venue: VenueCardData;
  onAskAbout?: (venueName: string) => void;
}

export default function VenueCard({ venue, onAskAbout }: VenueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "glass-card-light overflow-hidden transition-all duration-300",
        expanded ? "min-w-[320px] max-w-[400px]" : "min-w-[260px] max-w-[300px] cursor-pointer hover:translate-y-[-1px]"
      )}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* ... image section stays same but add onClick to toggle ... */}

      {/* Expanded details section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Amenities */}
          <div>
            <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {venue.amenities.map(a => (
                <span key={a} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/60">
                  {a.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Missing requirements */}
          {venue.matchScore?.missingRequirements && venue.matchScore.missingRequirements.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Missing</p>
              {venue.matchScore.missingRequirements.map((req, i) => (
                <p key={i} className="text-[11px] text-red-400/70">• {req}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {onAskAbout && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAskAbout(venue.name); }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-om-orange/10 border border-om-orange/20 text-om-orange text-xs font-medium hover:bg-om-orange/20 transition-colors"
              >
                Ask about this venue
              </button>
            )}
            <Link
              href={`/venues/${venue.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
            >
              Full page →
            </Link>
          </div>

          {/* Collapse button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="w-full text-center text-[10px] text-white/30 hover:text-white/50 transition-colors pt-1"
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
```

Add necessary imports:
```typescript
import { useState } from "react";
import { cn } from "@/lib/utils";
```

**Step 2: Update ChatMessage to pass onAskAbout callback**

In `ChatMessage.tsx`, update the venue card rendering to accept and pass the callback:

```typescript
// Update props
interface ChatMessageProps {
  message: ChatMessageType;
  onAskAboutVenue?: (venueName: string) => void;
}

// Update VenueCard usage
<VenueCard
  key={v.slug}
  venue={v}
  onAskAbout={onAskAboutVenue}
/>
```

Then in `ChatInterface.tsx`, pass the callback when rendering ChatMessage:

```tsx
<ChatMessage
  message={m}
  onAskAboutVenue={(name) => setInput(`Tell me more about ${name} — what makes it special and is it a good fit for my needs?`)}
/>
```

**Step 3: Commit**

```bash
git add src/components/chat/VenueCard.tsx src/components/chat/ChatMessage.tsx src/components/chat/ChatInterface.tsx
git commit -m "feat: expandable venue cards with inline details and ask-about action"
```

---

### Task 9: Expand Venue Seed Data to 50-60 Venues

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Add ~30 new venues to the venues array**

Add new venues after the existing ones, targeting 10-12 per city. Key strategy:

**Amsterdam (add 4-6 more, total 10-12):**
- Budget meeting room (capacity 15, €400/day) — for variety
- Mid-range conference center (capacity 40, €3,200/day, full amenities) — PERFECT MATCH TARGET
- Another mid-range conference center (capacity 45, €4,500/day, full amenities) — PERFECT MATCH TARGET
- Workshop space (capacity 60, €900/day)
- Premium hotel conference (capacity 150, €5,500/day)
- Small coworking (capacity 20, €350/day)

**Rotterdam (add 6-8 more, total 10-12):**
- Budget coworking (capacity 25, €300/day)
- Meeting room (capacity 30, €500/day)
- Conference center (capacity 200, €2,500/day)
- Hotel (capacity 80, €1,400/day)
- Workshop space (capacity 50, €750/day)
- Unique venue — rooftop (capacity 60, €1,800/day)
- Premium conference center (capacity 300, €4,000/day)
- Small meeting room (capacity 12, €250/day)

**Utrecht (add 7-9 more, total 10-12):**
- Meeting room (capacity 20, €350/day)
- Conference center (capacity 150, €2,000/day)
- Hotel (capacity 70, €1,100/day)
- Workshop space (capacity 40, €600/day)
- Coworking (capacity 30, €400/day)
- Unique venue — barn (capacity 90, €1,500/day)
- Premium conference (capacity 250, €3,500/day)
- Small boardroom (capacity 10, €200/day)
- Mid-range meeting room (capacity 50, €800/day)

**The Hague (add 6-8 more, total 10-12):**
- Meeting room (capacity 25, €450/day)
- Conference center (capacity 200, €2,400/day)
- Hotel conference (capacity 100, €1,600/day)
- Coworking (capacity 35, €380/day)
- Workshop space (capacity 55, €700/day)
- Unique venue — greenhouse (capacity 45, €1,200/day)
- Premium diplomatic venue (capacity 300, €5,000/day)
- Small studio (capacity 15, €280/day)

**Eindhoven (add 7-9 more, total 10-12):**
- Meeting room (capacity 20, €320/day)
- Coworking (capacity 40, €450/day)
- Hotel (capacity 90, €1,300/day)
- Workshop space (capacity 60, €850/day)
- Small conference room (capacity 30, €500/day)
- Unique venue — brewery (capacity 75, €1,100/day)
- Budget training room (capacity 50, €550/day)
- Premium venue (capacity 200, €3,000/day)
- Intimate boardroom (capacity 8, €180/day)

Each venue should have:
- Realistic Dutch name and address
- Plausible description (2-3 sentences)
- Strategic amenity gaps (some without parking, some without catering, etc.)
- Varied ratings (3.8-4.9)
- Appropriate expert names and contact info
- Real Unsplash images (reuse existing ones — they're generic conference/venue photos)

**IMPORTANT FOR DEMO SCENARIOS:**
- The two Amsterdam conference centers at capacity 40-45, price €3,200-4,500, with full amenities (wifi, catering, projector, av_equipment, breakout_rooms, parking, accessibility, video_conferencing) are the **perfect match targets**
- NO venue should have "castle", "helicopter", "Michelin", or "estate" features — these are what the expertCta demo asks for but can't find

**Step 2: Update the seed count log message**

```typescript
console.log("Seeding database with Dutch venues...");
```

**Step 3: Run seed to verify**

```bash
npx prisma db seed
```

Expected: "Seeded 55 venues successfully." (or similar 50-60 count)

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: expand venue data to 55 venues with strategic diversity"
```

---

### Task 10: Integration Testing & Polish

**Step 1: Build the project**

```bash
npm run build
```

Fix any TypeScript errors that arise.

**Step 2: Run the dev server and test manually**

```bash
npm run dev
```

Test checklist:
- [ ] Click "Perfect Venue" demo → AI greets and offers suggestions → click suggestion → it fills input (NOT auto-send) → send manually → AI responds with new suggestions → eventually searches venues → venues show with 85%+ scores → inline expansion works
- [ ] Click "Live Agent" demo → AI pushes toward luxury/niche → suggestions get more exotic → searches return low scores → AI recommends expert → ExpertCTA appears
- [ ] Upload an image → preview appears as pill → send → AI acknowledges and analyzes the image
- [ ] Upload a PDF → preview appears as pill → send → AI reads the extracted text
- [ ] Click a venue card → expands with details → "Ask about this venue" fills input
- [ ] Sample prompts fill input instead of auto-sending
- [ ] Type freely without demo mode → normal conversation works

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: polish and integration fixes for conversational AI chat"
```

---

## Task Dependency Graph

```
Task 1 (Types) ──┐
Task 2 (pdf-parse) ──┤
                     ├── Task 4 (API Route) ──┐
Task 3 (venue-tools) ┘                        │
                                               ├── Task 6 (ChatInterface) ── Task 8 (VenueCard) ── Task 10 (Testing)
Task 5 (PDF API) ─────────────────────────────┘
Task 7 (ChatMessage) ─────────────────────────────────────────────────────── Task 8 (VenueCard)
Task 9 (Seed Data) ────────────────────────────────────────────────────────── Task 10 (Testing)
```

**Parallelizable:** Tasks 1, 2, 3, 5 can all be done simultaneously. Task 9 is independent of everything except testing.
