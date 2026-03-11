import { Bot, User } from "lucide-react";
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

export default function ChatMessage({ message }: { message: ChatMessageType }) {
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

        {/* Venue cards */}
        {message.venues && message.venues.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {message.venues.map((v) => (
              <VenueCard key={v.slug} venue={v} />
            ))}
          </div>
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
