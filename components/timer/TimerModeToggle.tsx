"use client";

import React from "react";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerModeToggle({ t }: Props) {
  return (
    <div className="flex gap-1 rounded-md border border-[hsl(var(--hairline))] p-0.5 bg-[hsl(var(--canvas-soft))]">
      <button
        onClick={() => t.handleModeChange("standard")}
        disabled={t.isActive}
        className={[
          "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
          t.mode === "standard"
            ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
            : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
          t.isActive ? "opacity-40 cursor-not-allowed" : "",
        ].join(" ")}
      >
        Standard
      </button>
      <button
        onClick={() => t.handleModeChange("pomodoro")}
        disabled={t.isActive}
        className={[
          "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
          t.mode === "pomodoro"
            ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
            : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body))]",
          t.isActive ? "opacity-40 cursor-not-allowed" : "",
        ].join(" ")}
      >
        🍅 Pomodoro
      </button>
    </div>
  );
}
