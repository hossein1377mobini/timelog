"use client";

import React from "react";
import { Coffee, Zap, Clock } from "lucide-react";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerDisplay({ t }: Props) {
  return (
    <>
      {/* Big time display */}
      <div
        className={[
          "text-5xl font-mono font-bold text-center py-6 rounded-lg transition-all duration-300",
          t.timerState === "break"
            ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]"
            : t.timerState === "running"
              ? "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]"
              : "text-[hsl(var(--body-strong))] bg-[hsl(var(--canvas-soft))]",
          t.flashActive ? "bg-[hsl(var(--primary)/0.15)]" : "",
        ].join(" ")}
      >
        {t.timeDisplay}
      </div>

      {/* Pomodoro counter */}
      {t.mode === "pomodoro" &&
        (t.timerState === "running" ||
          t.timerState === "break" ||
          t.timerState === "paused") && (
          <div className="flex items-center justify-center gap-1.5 text-[13px] text-[hsl(var(--muted))]">
            <span className="text-base">🍅</span>
            <span>×</span>
            <span className="font-semibold text-[hsl(var(--body-strong))]">
              {t.pomodoroCount}
            </span>
            <span className="ml-1">completed this session</span>
          </div>
        )}

      {/* Status message */}
      {t.statusMessage() && (
        <p className="text-center text-[13px] text-[hsl(var(--muted))] flex items-center justify-center gap-1.5">
          {t.timerState === "break" ? (
            <Coffee className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
          ) : t.timerState === "running" ? (
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-[hsl(var(--muted))]" />
          )}
          {t.statusMessage()}
        </p>
      )}
    </>
  );
}
