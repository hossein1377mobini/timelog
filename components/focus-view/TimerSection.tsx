"use client";

import React from "react";

interface TimerSectionProps {
  timeDisplay: string;
  statusMessage: () => string | null;
  mode: string;
  timerState: string;
  pomodoroSeconds: number;
  preset: { work: number };
  pomodoroCount: number;
  isActive: boolean;
  taskName: string;
  tags: string[];
}

export default function TimerSection({
  timeDisplay,
  statusMessage,
  mode,
  timerState,
  pomodoroSeconds,
  preset,
  pomodoroCount,
  isActive,
  taskName,
  tags,
}: TimerSectionProps) {
  return (
    <>
      {/* Contextual display — what am I working on? */}
      {taskName && (
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-1">
            Focusing on
          </p>
          <p className="text-[16px] font-medium text-[hsl(var(--body-strong))]">
            {taskName}
          </p>
          {tags.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Big timer display */}
      <div className="relative mb-8">
        {/* Progress ring for pomodoro mode */}
        {mode === "pomodoro" && isActive && (
          <svg
            className="absolute inset-0 -m-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="2"
              opacity="0.15"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={timerState === "break" ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - pomodoroSeconds / (preset.work * 60))}`}
              className="transition-all duration-1000"
            />
          </svg>
        )}

        <div className="text-center px-8 py-8">
          <span className="text-[56px] md:text-[72px] font-light tabular-nums tracking-[-2px] text-[hsl(var(--body-strong))]">
            {timeDisplay}
          </span>
          {statusMessage() && (
            <p className="text-[12px] text-[hsl(var(--muted))] mt-2">
              {statusMessage()}
            </p>
          )}
          {mode === "pomodoro" && pomodoroCount > 0 && (
            <p className="text-[11px] text-[hsl(var(--success))] mt-1 font-medium">
              {pomodoroCount} pomodoro{pomodoroCount !== 1 ? "s" : ""} completed
            </p>
          )}
        </div>
      </div>
    </>
  );
}
