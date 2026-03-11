"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isDateAvailable } from "@/lib/utils";

interface AvailabilityCalendarProps {
  slug: string;
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export default function AvailabilityCalendar({
  slug,
  onDateSelect,
  selectedDate,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: { day: number; dateStr: string; available: boolean; isPast: boolean }[] =
      [];

    // Pad start
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      result.push({ day: 0, dateStr: "", available: false, isPast: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const available = !isPast && isDateAvailable(slug, dateStr);
      result.push({ day: d, dateStr, available, isPast });
    }

    return result;
  }, [currentMonth, slug]);

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset((p) => Math.max(0, p - 1))}
          disabled={monthOffset === 0}
          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white">{monthName}</span>
        <button
          onClick={() => setMonthOffset((p) => Math.min(2, p + 1))}
          disabled={monthOffset >= 2}
          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium py-1"
            style={{ color: "var(--text-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (d.day === 0) {
            return <div key={`empty-${i}`} />;
          }

          const isSelected = d.dateStr === selectedDate;

          return (
            <button
              key={d.dateStr}
              disabled={d.isPast || !d.available}
              onClick={() => d.available && onDateSelect?.(d.dateStr)}
              className={`
                text-center text-xs py-1.5 rounded-lg transition-all
                ${d.isPast ? "opacity-20 cursor-not-allowed" : ""}
                ${!d.isPast && !d.available ? "text-red-400/60 line-through cursor-not-allowed" : ""}
                ${!d.isPast && d.available && !isSelected ? "text-green-400 hover:bg-green-500/10 cursor-pointer" : ""}
                ${isSelected ? "bg-om-orange text-white font-medium" : ""}
              `}
            >
              {d.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400/60" /> Booked
        </span>
      </div>
    </div>
  );
}
