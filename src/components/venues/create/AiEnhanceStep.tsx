"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, MapPin, Users, Check, Train, Car, Leaf, Eye, Zap, Wand2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { VenueFormData } from "./VenueCreateWizard";

interface AiEnhanceStepProps {
  formData: VenueFormData;
  updateForm: (partial: Partial<VenueFormData>) => void;
}

interface ListingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  isStreaming?: boolean;
}

// Calls a lightweight API to generate a realistic owner response based on conversation context
async function fetchAutoReply(
  aiQuestion: string,
  formData: VenueFormData,
  conversationHistory?: { role: string; content: string }[]
): Promise<string> {
  try {
    const res = await fetch("/api/venues/auto-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiQuestion, venueData: formData, conversationHistory }),
    });
    if (!res.ok) throw new Error("Auto-reply API failed");
    const data = await res.json();
    return data.reply || "";
  } catch {
    return "";
  }
}

export default function AiEnhanceStep({ formData, updateForm }: AiEnhanceStepProps) {
  const [messages, setMessages] = useState<ListingMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestedForMsgRef = useRef<string | null>(null);
  const suggestionCountRef = useRef(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_SUGGESTIONS = 12;

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ListingMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    const assistantMessage: ListingMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, assistantMessage]);
    setInput("");
    stopTypewriter();
    suggestedForMsgRef.current = null;
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/venues/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, venueData: formData }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = { ...last, isStreaming: false };
              }
              return updated;
            });
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "text") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.content,
                  };
                }
                return updated;
              });
            }

            if (parsed.type === "field_update") {
              // Apply AI updates to the form data
              const updates: Partial<VenueFormData> = {};
              const args = parsed.content;

              if (parsed.tool === "update_description") {
                if (args.description) updates.description = args.description;
                if (args.shortDescription) updates.shortDescription = args.shortDescription;
              } else if (parsed.tool === "update_amenities") {
                if (args.amenities) updates.amenities = args.amenities;
              } else if (parsed.tool === "update_facilities") {
                if (args.facilities) updates.facilities = args.facilities;
              } else if (parsed.tool === "update_room_layouts") {
                if (args.roomLayouts) updates.roomLayouts = args.roomLayouts;
              } else if (parsed.tool === "update_transport") {
                if (args.transportInfo) updates.transportInfo = args.transportInfo;
                if (args.parkingInfo) updates.parkingInfo = args.parkingInfo;
              } else if (parsed.tool === "update_terms") {
                if (args.termsAndConditions) updates.termsAndConditions = args.termsAndConditions;
                if (args.sustainabilityInfo) updates.sustainabilityInfo = args.sustainabilityInfo;
              }

              if (Object.keys(updates).length > 0) {
                updateForm(updates);
              }
            }

            if (parsed.type === "question") {
              // Add suggestions to the last assistant message
              const suggestions = parsed.content.suggestions as string[] | undefined;
              if (suggestions?.length) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, suggestions };
                  }
                  return updated;
                });
              }
            }

            if (parsed.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: `Sorry, something went wrong: ${parsed.content}`,
                    isStreaming: false,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, I couldn't connect to the AI service. Please check your API key configuration.",
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTypewriter = useCallback(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
      setIsSuggesting(false);
    }
  }, []);

  const triggerSuggestion = useCallback(async () => {
    if (isSuggesting || isLoading || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.isStreaming) return;
    if (!lastMsg.content.includes("?")) return;

    setIsSuggesting(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await fetchAutoReply(
        lastMsg.content,
        formData,
        conversationHistory
      );

      if (!reply) {
        setIsSuggesting(false);
        return;
      }

      // Typewriter effect: type characters one at a time into input
      let charIndex = 0;
      setInput("");
      typewriterRef.current = setInterval(() => {
        if (charIndex < reply.length) {
          setInput((prev) => prev + reply[charIndex]);
          charIndex++;
        } else {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          typewriterRef.current = null;
          setIsSuggesting(false);
        }
      }, 30);
    } catch {
      setIsSuggesting(false);
    }
  }, [isSuggesting, isLoading, messages, formData]);

  // Demo mode: auto-suggest after AI finishes asking a question
  useEffect(() => {
    if (!demoMode || isLoading || isSuggesting || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.isStreaming) return;
    if (!lastMsg.content.includes("?")) return;
    if (suggestedForMsgRef.current === lastMsg.id) return;

    suggestedForMsgRef.current = lastMsg.id;

    if (suggestionCountRef.current >= MAX_SUGGESTIONS) {
      setDemoMode(false);
      return;
    }

    suggestionCountRef.current++;

    const timer = setTimeout(() => {
      triggerSuggestion();
    }, 3000);

    return () => clearTimeout(timer);
  }, [messages, demoMode, isLoading, isSuggesting, triggerSuggestion]);

  const handleStart = () => {
    setStarted(true);
    sendMessage("Hi! I'd like help creating my venue listing. Please review the info I've provided and help me complete the listing.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Not started yet — show the start screen
  if (!started) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-om-orange/10">
            <Sparkles className="h-10 w-10 text-om-orange" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">AI Listing Assistant</h2>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: "var(--text-secondary)" }}>
            Chat with our AI to build your venue listing interactively. The AI will ask you
            targeted questions about your venue and update the listing in real-time. You&apos;ll see
            a live preview as the listing takes shape.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs mb-8">
            {["Description & tagline", "Facilities & amenities", "Room layouts", "Transport & terms"].map((item) => (
              <div
                key={item}
                className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/60"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="px-8 py-3 rounded-xl bg-om-orange text-white font-semibold hover:bg-om-orange-dark transition-colors"
            >
              Start AI Conversation
            </button>
            <button
              type="button"
              onClick={() => setDemoMode((prev) => !prev)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                demoMode
                  ? "bg-om-orange/20 border border-om-orange/50 text-om-orange"
                  : "bg-white/5 border border-om-orange/30 text-om-orange hover:bg-om-orange/10"
              }`}
            >
              <Zap className="h-4 w-4" />
              {demoMode ? "Demo Mode Enabled" : "Enable Demo Mode"}
            </button>
            <p className="text-[10px] text-white/30">
              {demoMode
                ? "Demo mode will suggest sample responses as you chat. Click Start to begin."
                : "Enable demo mode to get AI-suggested responses during the conversation"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main interactive view: chat + preview
  return (
    <div className="space-y-4">
      {/* Mobile preview toggle */}
      <div className="lg:hidden flex justify-end">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? "Show Chat" : "Show Preview"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <div className={`glass-card flex flex-col h-[600px] ${showPreview ? "hidden lg:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-om-orange" />
            <span className="text-sm font-medium text-white">AI Listing Assistant</span>
            {demoMode && (
              <button
                type="button"
                onClick={() => setDemoMode(false)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-om-orange/15 border border-om-orange/25 text-[10px] text-om-orange font-medium hover:bg-om-orange/25 transition-colors"
                title="Click to disable demo mode"
              >
                <Zap className="h-3 w-3" />
                Demo
              </button>
            )}
            <CompletionBadge formData={formData} />
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id}>
                <MessageBubble message={m} />
                {/* Quick reply suggestions */}
                {m.suggestions && m.suggestions.length > 0 && !m.isStreaming && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-11">
                    {m.suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => sendMessage(s)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-om-orange/10 border border-om-orange/20 text-om-orange text-xs font-medium hover:bg-om-orange/20 transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={stopTypewriter}
                placeholder="Tell the AI about your venue..."
                rows={1}
                className={`glass-input flex-1 px-3 py-2.5 text-sm resize-none ${
                  isSuggesting ? "text-om-orange/80" : ""
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={triggerSuggestion}
                disabled={isLoading || isSuggesting || messages.length === 0}
                className="bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white/60 hover:text-om-orange px-2.5 py-2.5 rounded-xl transition-colors"
                title="Suggest a response"
              >
                {isSuggesting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-om-orange" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-om-orange hover:bg-om-orange-dark disabled:opacity-40 text-white px-3 py-2.5 rounded-xl transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className={`glass-card h-[600px] overflow-y-auto ${showPreview ? "block" : "hidden lg:block"}`}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 sticky top-0 z-10 bg-[var(--glass-bg)] backdrop-blur-xl">
            <Eye className="h-4 w-4 text-om-orange" />
            <span className="text-sm font-medium text-white">Live Preview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-om-orange/15 text-om-orange ml-auto">
              Updates in real-time
            </span>
          </div>

          <div className="p-4 space-y-4">
            <LivePreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletionBadge({ formData }: { formData: VenueFormData }) {
  const fields = [
    formData.description,
    formData.shortDescription,
    formData.amenities.length > 0,
    formData.facilities.length > 0,
    formData.transportInfo,
    formData.parkingInfo,
    formData.termsAndConditions,
    formData.sustainabilityInfo,
  ];
  const filled = fields.filter(Boolean).length;
  const total = fields.length;
  const pct = Math.round((filled / total) * 100);

  return (
    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
      {pct}% complete
    </span>
  );
}

function MessageBubble({ message }: { message: ListingMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser ? "bg-om-orange/20 border border-om-orange/30" : "bg-white/10 border border-white/15"
      }`}>
        {isUser ? <User className="h-3.5 w-3.5 text-om-orange" /> : <Bot className="h-3.5 w-3.5 text-white/70" />}
      </div>
      <div className={`max-w-[85%] min-w-0 text-sm rounded-2xl px-4 py-2.5 ${
        isUser ? "bg-om-orange/15 border border-om-orange/20 text-white" : "bg-white/[0.06] border border-white/10 text-white/80"
      }`}>
        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="chat-typing-dot w-1.5 h-1.5 bg-white/50 rounded-full" />
            <span className="chat-typing-dot w-1.5 h-1.5 bg-white/50 rounded-full" />
            <span className="chat-typing-dot w-1.5 h-1.5 bg-white/50 rounded-full" />
          </div>
        ) : (
          <div className={message.isStreaming ? "streaming-cursor" : ""}>
            {renderSimpleMarkdown(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderSimpleMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <span key={i} className="block h-1.5" />;
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <span key={i} className="block pl-3 before:content-['•'] before:mr-2 before:text-om-orange">
          {renderBold(line.slice(2))}
        </span>
      );
    }
    return <span key={i} className="block">{renderBold(line)}</span>;
  });
}

function renderBold(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function LivePreview({ formData }: { formData: VenueFormData }) {
  const hasContent = formData.description || formData.shortDescription || formData.amenities.length > 0 ||
    formData.facilities.length > 0 || formData.roomLayouts.length > 0 || formData.transportInfo || formData.parkingInfo;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">{formData.name}</h2>
        {formData.shortDescription ? (
          <p className="text-xs italic text-om-orange mt-1">{formData.shortDescription}</p>
        ) : (
          <p className="text-xs italic text-white/30 mt-1">Tagline will appear here...</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {formData.address || formData.city}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {formData.capacity} guests
          </span>
          <span className="text-xs">{formatPrice(formData.pricePerDay)}/day</span>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
        <h3 className="text-xs font-semibold text-white mb-2">About</h3>
        {formData.description ? (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {formData.description}
          </p>
        ) : (
          <p className="text-xs text-white/20 italic">Description will appear here as you chat with the AI...</p>
        )}
      </div>

      {/* Amenities */}
      {formData.amenities.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-2">Amenities</h3>
          <div className="flex flex-wrap gap-1.5">
            {formData.amenities.map((a) => (
              <span key={a} className="px-2 py-1 rounded-md bg-om-orange/10 border border-om-orange/20 text-om-orange text-[10px] font-medium">
                {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Facilities */}
      {formData.facilities.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-2">Facilities</h3>
          <div className="space-y-3">
            {formData.facilities.map((cat, i) => (
              <div key={i}>
                <p className="text-[10px] font-medium text-om-orange mb-1">{cat.category}</p>
                <div className="grid grid-cols-2 gap-1">
                  {cat.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      <Check className="h-2.5 w-2.5 text-om-orange shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Layouts */}
      {formData.roomLayouts.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-2">Room Layouts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-1 px-1 text-white/50">Room</th>
                  <th className="text-center py-1 px-1 text-white/50">Theater</th>
                  <th className="text-center py-1 px-1 text-white/50">Class</th>
                  <th className="text-center py-1 px-1 text-white/50">U</th>
                  <th className="text-center py-1 px-1 text-white/50">Board</th>
                  <th className="text-center py-1 px-1 text-white/50">Cabaret</th>
                  <th className="text-center py-1 px-1 text-white/50">Recep</th>
                </tr>
              </thead>
              <tbody>
                {formData.roomLayouts.map((layout, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-1 px-1 text-white font-medium">{layout.name}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.theater ?? "—"}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.classroom ?? "—"}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.uShape ?? "—"}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.boardroom ?? "—"}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.cabaret ?? "—"}</td>
                    <td className="text-center py-1 px-1 text-white/70">{layout.reception ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transport */}
      {formData.transportInfo && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
            <Train className="h-3 w-3 text-om-orange" />
            Transport
          </h3>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{formData.transportInfo}</p>
        </div>
      )}

      {/* Parking */}
      {formData.parkingInfo && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
            <Car className="h-3 w-3 text-om-orange" />
            Parking
          </h3>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{formData.parkingInfo}</p>
        </div>
      )}

      {/* Terms */}
      {formData.termsAndConditions && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
          <h3 className="text-xs font-semibold text-white mb-1.5">Terms & Conditions</h3>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{formData.termsAndConditions}</p>
        </div>
      )}

      {/* Sustainability */}
      {formData.sustainabilityInfo && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
          <h3 className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1.5">
            <Leaf className="h-3 w-3" />
            Sustainability
          </h3>
          <p className="text-[10px] leading-relaxed text-green-300/80">{formData.sustainabilityInfo}</p>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-white/5">
            <Eye className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-xs text-white/30">
            Your listing preview will build up here as you chat with the AI
          </p>
        </div>
      )}
    </div>
  );
}
