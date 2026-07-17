"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Flame, RotateCcw, LogOut } from "lucide-react";

interface HabitItemProps {
  habit: {
    id: string;
    name: string;
    checkins: string[];
    createdAt: string;
  };
  today: string;
  checkedInToday: boolean;
  totalDays: number;
  accentClass: string;
  squares: React.ReactNode[];
  onCheckin: () => void;
  onReset: () => void;
  onQuit: () => void;
}

export default function HabitItem({
  habit,
  today: _today,
  checkedInToday,
  totalDays,
  accentClass,
  squares,
  onCheckin,
  onReset,
  onQuit,
}: HabitItemProps) {
  return (
    <div
      className={`border border-[hsl(var(--hairline))] rounded-[12px] p-3 hover:border-[hsl(var(--hairline-strong))] transition-all ${accentClass}`}
    >
      {/* Top row: name, total days, quit button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">
            {habit.name}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]">
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onQuit}
          className="w-7 h-7 rounded-[6px] bg-[hsl(var(--surface-strong))] flex items-center justify-center text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-all active:scale-95"
          aria-label="Quit habit"
        >
          <LogOut size={12} />
        </button>
      </div>

      {/* Show-up sequence */}
      <div className="relative mb-2" style={{ minHeight: "30px" }}>
        <div className="text-[10px] text-[hsl(var(--muted))] mb-1">Show up sequence</div>
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ maxWidth: "100%" }}>
          {squares}
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--hairline))]">
        <Button
          size="sm"
          className="flex-1 h-9 gap-1.5"
          onClick={onCheckin}
          variant={checkedInToday ? "secondary" : "default"}
        >
          {checkedInToday ? (
            <>
              <Check size={12} className="text-[hsl(var(--success))]" />
              <span className="text-[13px]">Done Today</span>
            </>
          ) : (
            <>
              <Flame size={12} />
              <span className="text-[13px]">Show Up</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-[12px] gap-1"
          onClick={onReset}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
