"use client";

import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-om-orange/15 border border-om-orange/25 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-om-orange" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">OneMeeting</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Enter the password to access this site.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Enter password"
              className="glass-input w-full px-4 py-3 text-sm text-center"
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">Incorrect password. Please try again.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 bg-om-orange hover:bg-om-orange-dark disabled:opacity-40 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? "Checking..." : "Enter Site"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
