"use client";

import React from "react";
import { cn, weekStartKey, weekEndKey } from "@/lib/utils";

interface WeekSquare {
  weekStart: string;
  weekEnd: string;
  total: number;
  completed: number;
}

interface YearGridProps {
  weeks: WeekSquare[];
  currentWeekStart: string;
  onWeekClick?: (weekStart: string) => void;
}

export default function YearGrid({ weeks, currentWeekStart, onWeekClick }: YearGridProps) {
  if (weeks.length === 0) {
    // Build a default 52-week grid starting from the current week's Monday
    const now = new Date();
    const monday = new Date(weekStartKey(now));
    for (let i = 0; i < 52; i++) {
      const start = new Date(monday);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      weeks.push({
        weekStart: weekStartKey(start),
        weekEnd: weekEndKey(start),
        total: 0,
        completed: 0,
      });
    }
    weeks.reverse();
  }

  // Group into months
  const monthLabels: { label: string; count: number }[] = [];
  let currentMonth = "";
  let countInMonth = 0;
  for (const w of weeks) {
    const d = new Date(w.weekStart);
    const monthKey = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (monthKey !== currentMonth) {
      if (currentMonth) {
        monthLabels.push({ label: currentMonth, count: countInMonth });
      }
      currentMonth = monthKey;
      countInMonth = 0;
    }
    countInMonth++;
  }
  if (currentMonth) {
    monthLabels.push({ label: currentMonth, count: countInMonth });
  }

  return (
    <div>
      {/* Month labels row */}
      <div className="flex mb-1">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="text-[9px] text-[hsl(var(--muted))] font-medium text-center"
            style={{ width: `${m.count * 14}px` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid of squares */}
      <div className="flex flex-wrap gap-[2px]">
        {weeks.map((w) => {
          const isCurrent = w.weekStart === currentWeekStart;
          const hasObjectives = w.total > 0;
          const allDone = hasObjectives && w.completed === w.total;
          const someIncomplete = hasObjectives && !allDone;

          let colorClass = "bg-[hsl(var(--surface-strong))]";
          if (someIncomplete) colorClass = "bg-[hsl(var(--error))]/30";
          else if (allDone) colorClass = "bg-[hsl(var(--success))]/60";
          else if (hasObjectives) colorClass = "bg-[hsl(var(--warning))]/60";

          return (
            <button
              key={w.weekStart}
              onClick={() => onWeekClick?.(w.weekStart)}
              className={cn(
                "w-[12px] h-[12px] rounded-[2px] transition-colors",
                "hover:scale-110 hover:z-10",
                colorClass,
                isCurrent && "ring-2 ring-[hsl(var(--primary))]"
              )}
              title={`${w.weekStart} – ${w.weekEnd}: ${w.completed}/${w.total} objectives`}
            />
          );
        })}
      </div>
    </div>
  );
}