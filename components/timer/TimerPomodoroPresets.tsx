"use client";

import React from "react";
import { POMODORO_PRESETS } from "@/lib/constants";
import type { PomodoroPreset } from "@/lib/constants";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerPomodoroPresets({ t }: Props) {
  if (t.mode !== "pomodoro" || t.timerState !== "idle") return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-[hsl(var(--muted))] font-medium uppercase tracking-wide">
        Work / Break
      </p>
      <div className="flex gap-2">
        {POMODORO_PRESETS.map((p: PomodoroPreset) => (
          <button
            key={p.label}
            onClick={() => t.handlePresetChange(p)}
            className={[
              "flex-1 py-2 rounded-md text-[12px] font-medium border transition-colors",
              t.preset.label === p.label
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]"
                : "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:border-[hsl(var(--hairline-strong))] hover:text-[hsl(var(--body))]",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
