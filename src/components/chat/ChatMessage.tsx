import { Bot, User, Image as ImageIcon, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import VenueCard from "./VenueCard";
import Link from "next/link";
import type { ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <strong key={i} className="block text-white text-sm font-semibold mt-3 mb-1">
          {renderInline(line.slice(4))}
        </strong>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <strong key={i} className="block text-white text-sm font-semibold mt-3 mb-1">
          {renderInline(line.slice(3))}
        </strong>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <span key={i} className="block pl-3 before:content-['•'] before:mr-2 before:text-om-orange">
          {renderInline(line.slice(2))}
        </span>
      );
      continue;
    }

    // Empty lines become spacing
    if (line.trim() === "") {
      elements.push(<span key={i} className="block h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <span key={i} className="block">
        {renderInline(line)}
      </span>
    );
  }

  return elements;
}

function VenueCarousel({ venues, onAskAbout }: { venues: ChatMessageType["venues"]; onAskAbout?: (name: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, venues]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 280; // approximate card width + gap
    el.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  if (!venues || venues.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg backdrop-blur-sm -ml-1"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        {venues.map((v) => (
          <div key={v.slug} className="snap-start">
            <VenueCard venue={v} onAskAbout={onAskAbout} />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg backdrop-blur-sm -mr-1"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Scroll hint for multiple cards */}
      {canScrollRight && venues.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <span className="text-[10px] text-white/40">
            Swipe or use arrows to see {venues.length} venues
          </span>
        </div>
      )}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Process bold (**text**) and italic (*text*) inline
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // Bold
      parts.push(
        <strong key={match.index} className="text-white font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      // Italic
      parts.push(
        <em key={match.index} className="text-white/90">
          {match[2]}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function ChatMessage({ message, onAskAboutVenue }: { message: ChatMessageType; onAskAboutVenue?: (name: string) => void }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-om-orange/20 border border-om-orange/30"
            : "bg-white/10 border border-white/15"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-om-orange" />
        ) : (
          <Bot className="h-4 w-4 text-white/70" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-3 max-w-[85%] min-w-0")}>
        <div
          className={cn(
            "chat-bubble text-sm",
            isUser ? "chat-bubble-user" : "chat-bubble-ai",
            message.isStreaming && !message.content && "flex items-center gap-1.5 py-3"
          )}
        >
          {message.isStreaming && !message.content ? (
            // Typing indicator
            <>
              <span className="chat-typing-dot w-2 h-2 bg-white/50 rounded-full" />
              <span className="chat-typing-dot w-2 h-2 bg-white/50 rounded-full" />
              <span className="chat-typing-dot w-2 h-2 bg-white/50 rounded-full" />
            </>
          ) : isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className={message.isStreaming ? "streaming-cursor" : ""}>
              {renderMarkdown(message.content)}
            </div>
          )}
        </div>

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

        {/* Venue cards carousel */}
        {message.venues && message.venues.length > 0 && (
          <VenueCarousel venues={message.venues} onAskAbout={onAskAboutVenue} />
        )}

        {/* Booking draft CTA */}
        {message.bookingDraft && (
          <Link
            href={message.bookingDraft.bookingUrl}
            className="inline-flex items-center gap-2 bg-om-orange text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-om-orange-dark transition-colors self-start"
          >
            Book {message.bookingDraft.venueName} →
          </Link>
        )}
      </div>
    </div>
  );
}
