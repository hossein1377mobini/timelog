"use client";

import React from "react";
import { INTERRUPTION_TYPE_META } from "@/lib/constants";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerInterruptionSummary({ t }: Props) {
  if (t.timerState !== "idle" || t.todayInterruptions.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const i of t.todayInterruptions)
    counts[i.type] = (counts[i.type] || 0) + 1;
  const topType = Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const totalMins = Math.round(
    t.todayInterruptions.reduce(
      (s: number, i: { duration: number }) => s + i.duration,
      0,
    ) / 60,
  );
  const last3 = [...t.todayInterruptions].reverse().slice(0, 3);

  return (
    <div className="rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas-soft))] px-3 py-2.5 space-y-1.5">
      <p className="text-[11px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1">
        📊 Today{'\u2019'}s interruptions
        <span className="ml-1 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-bold">
          {t.todayInterruptions.length}
        </span>
      </p>
      <div className="border-t border-[hsl(var(--hairline))] pt-1.5 space-y-0.5">
        <p className="text-[11px] text-[hsl(var(--muted))]">
          Most common:{" "}
          <span className="text-[hsl(var(--body))] font-medium">
            {
              INTERRUPTION_TYPE_META.find(
                (x) => x.value === topType?.[0],
              )?.emoji
            }{" "}
            {topType?.[0]} ({topType?.[1]}×)
          </span>
        </p>
        <p className="text-[11px] text-[hsl(var(--muted))]">
          Total time lost:{" "}
          <span className="text-[hsl(var(--body))] font-medium">
            {totalMins}m
          </span>
        </p>
      </div>
      <div className="space-y-0.5 pt-0.5">
        {last3.map(
          (
            i: {
              type: string;
              duration: number;
              note: string;
              timestamp: string;
            },
            idx: number,
          ) => {
            const meta = INTERRUPTION_TYPE_META.find(
              (x) => x.value === i.type,
            );
            const mins = Math.round(i.duration / 60);
            const note = i.note
              ? i.note.length > 28
                ? i.note.slice(0, 28) + "..."
                : i.note
              : "—";
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted))]"
              >
                <span>{meta?.emoji ?? "•"}</span>
                <span className="capitalize">{i.type}</span>
                <span className="text-[hsl(var(--hairline-strong))]">
                  ·
                </span>
                <span className="flex-1 truncate">{note}</span>
                <span className="shrink-0 text-[10px]">
                  {mins}m
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
