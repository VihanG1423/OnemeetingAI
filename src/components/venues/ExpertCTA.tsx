"use client";

import { useState } from "react";
import { Phone, Mail, X, Send, Headset } from "lucide-react";
import toast from "react-hot-toast";
import type { MatchCriteria } from "@/types";

interface ExpertCTAProps {
  criteria?: MatchCriteria;
  compact?: boolean;
}

export default function ExpertCTA({ criteria, compact }: ExpertCTAProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requirements, setRequirements] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !requirements) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/expert-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, requirements, criteria }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setSubmitted(true);
      setShowForm(false);
      toast.success("Request submitted! Our expert will contact you shortly.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-green-400/15 flex items-center justify-center mx-auto mb-3">
          <Headset className="h-5 w-5 text-green-400" />
        </div>
        <p className="text-sm font-medium text-white mb-1">Request received!</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          A OneMeeting expert will reach out within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`glass-card ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-om-orange/15 flex items-center justify-center shrink-0">
            <Headset className="h-5 w-5 text-om-orange" />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-white ${compact ? "text-sm" : "text-base"} mb-1`}>
              Can&apos;t find the perfect venue?
            </h3>
            <p className={`${compact ? "text-xs" : "text-sm"} mb-4`} style={{ color: "var(--text-secondary)" }}>
              Our venue experts have access to 1,500+ venues and can find exactly
              what you need.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-om-orange hover:bg-om-orange-dark text-white text-xs font-medium rounded-full transition-colors"
              >
                <Send className="h-3 w-3" />
                Talk to an Expert
              </button>
              <a
                href="tel:+31201234567"
                className="flex items-center gap-1.5 glass-pill px-3 py-2 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <Phone className="h-3 w-3" />
                +31 20 123 4567
              </a>
              <a
                href="mailto:experts@onemeeting.nl"
                className="flex items-center gap-1.5 glass-pill px-3 py-2 text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                <Mail className="h-3 w-3" />
                Email us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative glass-card p-6 w-full max-w-md animate-fade-in-scale">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-om-orange/15 flex items-center justify-center">
                <Headset className="h-4 w-4 text-om-orange" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Get Expert Help
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Your name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm"
                  placeholder="+31 6 12345678"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  What are you looking for? *
                </label>
                <textarea
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                  className="glass-input w-full px-3 py-2 text-sm resize-none"
                  placeholder="Describe your ideal venue, event type, number of attendees, dates, and any special requirements..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-om-orange hover:bg-om-orange-dark text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
