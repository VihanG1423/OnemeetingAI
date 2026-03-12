"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Zap, ChevronDown, ChevronUp } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ExpertCTA from "../venues/ExpertCTA";
import type { ChatMessage as ChatMessageType, VenueCardData, BookingDraftData } from "@/types";

const suggestions = [
  "We're planning a 2-day leadership retreat for 30 people near Amsterdam with breakout rooms and catering — what do you recommend?",
  "I need a unique venue for a product launch in Rotterdam, around 100 guests, with AV equipment and drinks reception space",
  "Looking for a board meeting room for 12 in Utrecht next month — needs video conferencing and parking, budget under €1,500",
  "We want something special for our annual team event — 80 people, preferably a historic or unusual venue, full-day with lunch",
];

// Extracts suggestions from AI text — handles both JSON tool-call format and bullet-point lists
function extractTextSuggestions(content: string): { cleanedContent: string; parsedSuggestions: string[] } {
  let cleaned = content;
  let suggestions: string[] = [];

  // 1. Try to extract JSON suggest_options block (when AI writes tool call as text)
  const jsonPattern = /suggest_options:\s*\{[\s\S]*?options:\s*\[[\s\S]*?\]\s*\}/gi;
  const codeBlockPattern = /```[\s\S]*?suggest_options[\s\S]*?```/gi;

  for (const pattern of [jsonPattern, codeBlockPattern]) {
    const match = cleaned.match(pattern);
    if (match) {
      const optionsMatch = match[0].match(/\[[\s\S]*?\]/);
      if (optionsMatch) {
        try {
          const fixedJson = optionsMatch[0].replace(/'/g, '"').replace(/,\s*\]/g, ']');
          const parsed = JSON.parse(fixedJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            suggestions = parsed.filter((s: unknown) => typeof s === 'string');
          }
        } catch { /* ignore */ }
      }
      cleaned = cleaned.replace(match[0], '').trim();
    }
  }

  // 2. If no JSON suggestions found, extract trailing bullet-point options from the text
  //    Look for a pattern like "options to consider:" or "would you like to:" followed by bullet points
  if (suggestions.length === 0) {
    const lines = cleaned.split('\n');
    const bulletLines: string[] = [];
    let bulletStartIdx = -1;

    // Scan from the end to find consecutive bullet lines
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        bulletLines.unshift(trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''));
        bulletStartIdx = i;
      } else if (bulletLines.length > 0) {
        break; // Stop once we hit a non-bullet line after finding bullets
      }
    }

    // Only use if we found 2-5 short bullet items that look like suggestions (not long paragraphs)
    if (bulletLines.length >= 2 && bulletLines.length <= 6 && bulletLines.every(b => b.length < 80)) {
      suggestions = bulletLines;
      // Check if the line before the bullets is an intro like "Here are some options:"
      // and remove the bullets + intro from content
      const introIdx = bulletStartIdx - 1;
      const introLine = introIdx >= 0 ? lines[introIdx].trim() : '';
      const isIntro = /(?:options|consider|like to|you could|next steps|try|here are|what would)/i.test(introLine);
      const removeFrom = isIntro ? introIdx : bulletStartIdx;
      cleaned = lines.slice(0, removeFrom).join('\n').trim();
    }
  }

  return { cleanedContent: cleaned, parsedSuggestions: suggestions };
}

interface ChatInterfaceProps {
  compact?: boolean;
}

// Demo scenario definitions
const demoScenarios = {
  perfectMatch: {
    label: "Perfect Match",
    description: "AI finds ideal venues",
    initialMessage: "We're planning a leadership retreat for 40 people in Amsterdam — we need a conference center with breakout rooms, catering, AV equipment, and good public transport access. Budget is around €2,500 per day.",
    followUps: [
      "That sounds great! Can you check availability for the top recommendation for next Thursday?",
      "Perfect, let's go ahead and start the booking process for that date.",
    ],
  },
  expertCta: {
    label: "Expert Referral",
    description: "AI suggests OneMeeting experts",
    initialMessage: "I need a very specific venue — a castle or historic estate near Maastricht for a formal 3-day diplomatic reception with 200 guests, multilingual staff, helicopter landing pad, and Michelin-star catering on-site. Budget is flexible.",
    followUps: [
      "Yes, I'd like to speak with a venue specialist who handles premium events like this.",
    ],
  },
};

// Auto-reply for venue finder demos — only uses scripted follow-ups, no AI generation
function getFinderAutoReply(scenario: string, turnIndex: number): string {
  const scenarioData = demoScenarios[scenario as keyof typeof demoScenarios];
  if (!scenarioData) return "";

  // Only use scripted follow-ups — stops the demo when they run out
  if (turnIndex < scenarioData.followUps.length) {
    return scenarioData.followUps[turnIndex];
  }

  return "";
}

export default function ChatInterface({ compact = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const [demoFinished, setDemoFinished] = useState<string | null>(null); // tracks which demo finished (e.g. "expertCta")
  const demoTurnRef = useRef(0);
  const autoReplyTriggeredRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageRef = useRef<((content: string) => Promise<void>) | null>(null);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // Auto-resize textarea as user types
  const resizeTextarea = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 120; // ~5 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-reply effect for demo mode
  useEffect(() => {
    if (!activeDemo || isLoading || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.isStreaming) return;
    if (lastMsg.content.startsWith("Sorry,")) return;
    if (autoReplyTriggeredRef.current === lastMsg.id) return;

    autoReplyTriggeredRef.current = lastMsg.id;

    // Get next scripted reply (returns "" when exhausted)
    const reply = getFinderAutoReply(activeDemo, demoTurnRef.current);

    if (!reply) {
      // Demo is complete — stop auto-replying
      setDemoFinished(activeDemo);
      setActiveDemo(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        demoTurnRef.current++;
        sendMessageRef.current?.(reply);
      }
    }, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [messages, activeDemo, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    const assistantMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build messages for API (only role + content)
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

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
              if (last && last.role === "assistant") {
                // Extract suggest_options if the AI wrote it as text instead of calling the tool
                const { cleanedContent, parsedSuggestions } = extractTextSuggestions(last.content);
                updated[updated.length - 1] = {
                  ...last,
                  content: cleanedContent,
                  suggestions: last.suggestions?.length ? last.suggestions : parsedSuggestions,
                  isStreaming: false,
                };
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
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.content,
                  };
                }
                return updated;
              });
            }

            if (parsed.type === "venues") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  const venues = parsed.content as VenueCardData[];
                  updated[updated.length - 1] = {
                    ...last,
                    venues: [...(last.venues || []), ...venues],
                  };
                }
                return updated;
              });
            }

            if (parsed.type === "booking_draft") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    bookingDraft: parsed.content as BookingDraftData,
                  };
                }
                return updated;
              });
            }

            if (parsed.type === "suggestions") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...last,
                    suggestions: parsed.content as string[],
                  };
                }
                return updated;
              });
            }

            if (parsed.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") {
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
        if (last && last.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content:
              "Sorry, I couldn't connect to the AI service. Please check your API key configuration.",
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Keep ref in sync for auto-reply effect
  sendMessageRef.current = sendMessage;

  const startDemo = (scenarioKey: string) => {
    const scenario = demoScenarios[scenarioKey as keyof typeof demoScenarios];
    if (!scenario) return;
    setActiveDemo(scenarioKey);
    setDemoFinished(null);
    demoTurnRef.current = 0;
    autoReplyTriggeredRef.current = null;
    sendMessage(scenario.initialMessage);
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

  return (
    <div
      className={`glass-card flex flex-col ${
        compact ? "h-[500px]" : "h-[calc(100vh-12rem)]"
      }`}
    >
      {/* Demo mode banner */}
      {activeDemo && (
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-om-orange" />
          <span className="text-xs font-medium text-om-orange">
            Auto Demo: {demoScenarios[activeDemo as keyof typeof demoScenarios]?.label}
          </span>
          <button
            type="button"
            onClick={() => setActiveDemo(null)}
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-autohide p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-om-orange/15 border border-om-orange/25 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-om-orange" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              OneMeeting AI Venue Advisor
            </h3>
            <p
              className="text-sm max-w-md mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Tell me about your meeting or event and I&apos;ll find the perfect
              venue in the Netherlands.
            </p>
            {/* Auto Demo buttons */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[10px] text-white/30 mb-3">Auto Demo Scenarios</p>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.entries(demoScenarios).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => startDemo(key)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-om-orange/30 text-om-orange text-xs font-medium hover:bg-om-orange/10 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {scenario.label}
                    <span className="text-white/30 font-normal">— {scenario.description}</span>
                  </button>
                ))}
              </div>

              {/* Collapsible sample prompts */}
              <button
                type="button"
                onClick={() => setShowSamplePrompts((v) => !v)}
                className="mt-4 flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors mx-auto"
              >
                {showSamplePrompts ? "Hide" : "Show"} example prompts
                {showSamplePrompts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showSamplePrompts && (
                <div className="flex flex-wrap justify-center gap-2 mt-3 animate-fade-in-up">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="glass-pill px-4 py-2 text-xs text-left hover:border-white/30 transition-colors text-white/50 hover:text-white/70"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m.id}>
              <ChatMessage message={m} />
              {/* Suggestion buttons — only show on the last assistant message */}
              {m.suggestions && m.suggestions.length > 0 && !m.isStreaming && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-2 mt-3 ml-11">
                  {m.suggestions.map((s, j) => (
                    <button
                      key={j}
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
          ))
        )}
        {/* Show ExpertCTA when expert referral demo completes */}
        {demoFinished === "expertCta" && (
          <div className="ml-11 animate-fade-in-up">
            <ExpertCTA compact />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
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
    </div>
  );
}
