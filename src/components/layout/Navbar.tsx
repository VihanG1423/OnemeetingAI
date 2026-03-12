"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MessageSquareText, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "AI Venue Finder", icon: MessageSquareText },
  { href: "/venues", label: "Browse Venues", icon: Building2 },
  { href: "/venues/create", label: "List Your Venue", icon: Plus },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="glass-navbar sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-om-orange">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <div>
              <span className="text-lg font-semibold text-white">One</span>
              <span className="text-lg font-semibold text-om-orange">Meeting</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-om-orange/15 text-om-orange border border-om-orange/25"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-om-orange/15 text-om-orange"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
