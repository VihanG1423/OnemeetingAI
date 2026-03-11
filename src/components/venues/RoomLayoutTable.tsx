"use client";

import { Users } from "lucide-react";
import type { RoomLayoutConfig } from "@/types";

const layoutLabels: Record<string, string> = {
  theater: "Theater",
  classroom: "Classroom",
  uShape: "U-Shape",
  boardroom: "Boardroom",
  cabaret: "Cabaret",
  reception: "Reception",
};

export default function RoomLayoutTable({ layouts }: { layouts: RoomLayoutConfig[] }) {
  const layoutKeys = ["theater", "classroom", "uShape", "boardroom", "cabaret", "reception"] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-3 text-white/60 font-medium">Room</th>
            {layoutKeys.map((key) => (
              <th key={key} className="text-center py-3 px-2 text-white/60 font-medium">
                {layoutLabels[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layouts.map((layout, i) => (
            <tr
              key={i}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-3 font-medium text-white">{layout.name}</td>
              {layoutKeys.map((key) => {
                const val = layout[key];
                return (
                  <td key={key} className="text-center py-3 px-2">
                    {val ? (
                      <span className="inline-flex items-center gap-1 text-white/80">
                        <Users className="h-3 w-3 text-om-orange" />
                        {val}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
