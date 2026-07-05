import React from "react";
import type { AnalyticsData } from "./analyticsDataHooks";

interface Props {
  data: AnalyticsData;
}

export function AnalyticsGoalsTab({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.goalProgress.length === 0 ? (
        <p className="text-[14px] text-[hsl(var(--muted))] text-center py-6">
          No goals defined yet.
        </p>
      ) : (
        data.goalProgress.map((g) => {
          const colorMap: Record<string, string> = {
            Purple: "#534AB7",
            Teal: "#0F6E56",
            Amber: "#854F0B",
            Blue: "#185FA5",
            Coral: "#993C1D",
            Gray: "#6B7280",
          };
          const barColor = colorMap[g.color] || "#534AB7";
          return (
            <div
              key={g.id}
              className="border border-[hsl(var(--hairline))] rounded-[12px] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">
                  {g.name}
                </span>
                <span className="text-[12px] text-[hsl(var(--muted))]">
                  {g.pct}%
                </span>
              </div>
              <div className="h-2 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${g.pct}%`, background: barColor }}
                />
              </div>
              <div className="flex gap-3 text-[10px] text-[hsl(var(--muted))]">
                <span>{g.logged}h logged</span>
                <span>{g.targetHours}h target</span>
                <span>
                  {Math.max(
                    0,
                    Math.round((g.targetHours - g.logged) * 10) / 10,
                  )}
                  h remaining
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
