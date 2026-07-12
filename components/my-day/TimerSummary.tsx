"use client";

import React from "react";
import { formatHM } from "@/lib/utils";

interface TimerSummaryProps {
  completedCount: number;
  totalCount: number;
  totalSeconds: number;
}

export default function TimerSummary({ completedCount, totalCount, totalSeconds }: TimerSummaryProps) {
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
          My Day
        </p>
        <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
          {completedCount}/{totalCount} tasks · {formatHM(totalSeconds)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--primary))] rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[12px] font-medium text-[hsl(var(--muted))] tabular-nums">
          {progressPct}%
        </span>
      </div>
    </div>
  );
}
