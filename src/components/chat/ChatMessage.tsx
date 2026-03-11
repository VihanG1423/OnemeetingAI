import { Bot, User } from "lucide-react";
import VenueCard from "./VenueCard";
import Link from "next/link";
import type { ChatMessage as ChatMessageType } from "@/types";
import { cn } from "@/lib/utils";

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
          ) : (
            <span className={message.isStreaming ? "streaming-cursor" : ""}>
              {message.content}
            </span>
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
