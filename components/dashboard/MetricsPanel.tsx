"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Goal, Session } from "@/lib/types";

interface MetricsPanelProps {
  goalProgress: Array<{
    goal: Goal;
    loggedHours: number;
    pct: number;
  }>;
}

function mapColor(color: string | undefined): string {
  switch (color) {
    case "Teal": return "#0F6E56";
    case "Purple": return "#534AB7";
    case "Amber": return "#854F0B";
    case "Blue": return "#185FA5";
    case "Coral": return "#993C1D";
    default: return "#6B7280";
  }
}

export default function MetricsPanel({ goalProgress }: MetricsPanelProps) {
  if (goalProgress.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
          This Week&rsquo;s Goals
        </p>
        {goalProgress.map(({ goal, loggedHours, pct }) => (
          <div key={goal.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[hsl(var(--body-strong))] truncate">
                {goal.name}
              </span>
              <span className="text-[11px] text-[hsl(var(--muted))] tabular-nums shrink-0 ml-2">
                {loggedHours.toFixed(1)}h / {goal.weeklyTarget}h
              </span>
            </div>
            <div className="h-1.5 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: mapColor(goal.color) }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
