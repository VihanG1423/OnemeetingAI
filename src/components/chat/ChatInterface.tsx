"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Zap, ChevronDown, ChevronUp, Plus, Image as ImageIcon, FileText, X, Wand2, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ExpertCTA from "../venues/ExpertCTA";
import type { ChatMessage as ChatMessageType, VenueCardData, BookingDraftData, ChatAttachment } from "@/types";

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

// Calls a lightweight API to generate a realistic customer response for demo scenarios
async function fetchChatAutoReply(
  aiMessage: string,
  demoScenario: string | null,
  conversationHistory?: { role: string; content: string }[]
): Promise<string> {
  try {
    const res = await fetch("/api/chat/auto-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiMessage, demoScenario, conversationHistory }),
    });
    if (!res.ok) throw new Error("Auto-reply API failed");
    const data = await res.json();
    return data.reply || "";
  } catch {
    return "";
  }
}

// Demo scenario definitions
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

// Detect if an assistant message is recommending an expert/specialist
function containsExpertReferral(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("venue specialist") ||
    lower.includes("venue experts") ||
    lower.includes("our specialists") ||
    lower.includes("our experts") ||
    lower.includes("expert team") ||
    lower.includes("reaching out to our") ||
    lower.includes("+31 20 123 4567") ||
    lower.includes("experts@onemeeting.nl") ||
    lower.includes("live agent") ||
    lower.includes("personalized approach") ||
    (lower.includes("specialist") && lower.includes("access to exclusive"))
  );
}

export default function ChatInterface({ compact = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [activeDemoScenario, setActiveDemoScenario] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? "instant" : "smooth",
      });
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

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    // Use instant scroll during streaming to avoid fighting smooth animations
    const isStreaming = last?.isStreaming;
    scrollToBottom(isStreaming);
  }, [messages, scrollToBottom]);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

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

    setIsSuggesting(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await fetchChatAutoReply(
        lastMsg.content,
        activeDemoScenario,
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
          const char = reply[charIndex];
          charIndex++;
          setInput((prev) => prev + char);
        } else {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          typewriterRef.current = null;
          setIsSuggesting(false);
        }
      }, 30);
    } catch {
      setIsSuggesting(false);
    }
  }, [isSuggesting, isLoading, messages, activeDemoScenario]);

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
    stopTypewriter();
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

  const startDemo = (scenarioKey: string) => {
    const scenario = demoScenarios[scenarioKey as keyof typeof demoScenarios];
    if (!scenario) return;
    setActiveDemoScenario(scenarioKey);
    setActiveDemo(scenarioKey);
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
            Demo: {demoScenarios[activeDemo as keyof typeof demoScenarios]?.label}
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
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm mx-auto">
                {Object.entries(demoScenarios).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => startDemo(key)}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-xl bg-white/5 border border-om-orange/30 text-om-orange text-xs font-medium hover:bg-om-orange/10 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      {scenario.label}
                    </span>
                    <span className="text-white/30 font-normal text-[10px]">{scenario.description}</span>
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
                      onClick={() => setInput(s)}
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
              <ChatMessage message={m} onAskAboutVenue={(name) => setInput(`Tell me more about ${name} — what makes it special and is it a good fit for my needs?`)} />
              {/* Suggestion buttons — only show on the last assistant message */}
              {m.suggestions && m.suggestions.length > 0 && !m.isStreaming && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-2 mt-3 ml-11">
                  {m.suggestions.map((s, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setInput(s)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-om-orange/10 border border-om-orange/20 text-om-orange text-xs font-medium hover:bg-om-orange/20 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {/* Show ExpertCTA when assistant message recommends an expert */}
              {m.role === "assistant" && !m.isStreaming && m.content && containsExpertReferral(m.content) && (
                <div className="ml-11 mt-3 animate-fade-in-up">
                  <ExpertCTA compact />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

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
              <div className="absolute bottom-full left-0 mb-2 py-1 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl min-w-[160px] animate-fade-in-up z-10">
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
            onFocus={stopTypewriter}
            placeholder="Describe your ideal meeting venue..."
            rows={1}
            className={`glass-input flex-1 px-4 py-3 text-sm resize-none overflow-hidden ${
              isSuggesting ? "text-om-orange/80" : ""
            }`}
            style={{ minHeight: "44px" }}
            disabled={isLoading}
          />
          {activeDemo && (
            <button
              type="button"
              onClick={triggerSuggestion}
              disabled={isLoading || isSuggesting || messages.length === 0}
              className="bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white/60 hover:text-om-orange px-3 py-3 rounded-xl transition-colors shrink-0 self-end"
              title="Suggest a response"
            >
              {isSuggesting ? (
                <Loader2 className="h-4 w-4 animate-spin text-om-orange" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </button>
          )}
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
