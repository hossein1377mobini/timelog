import React from "react";
import { Clock, CalendarDays, Award, Activity } from "lucide-react";
import { formatHM } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsData } from "./analyticsDataHooks";
import type { Interruption } from "@/lib/types";

interface Props {
  data: AnalyticsData;
  interruptions: Interruption[];
}

export function AnalyticsInsightsTab({ data, interruptions }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        {
          icon: Clock,
          label: "Best time",
          value: data.bestTime,
          sub: "Most productive",
        },
        {
          icon: CalendarDays,
          label: "Best day",
          value: data.bestDay,
          sub: "Highest total",
        },
        {
          icon: Award,
          label: "Avg session",
          value: formatHM(data.avgSessionSeconds),
          sub: `${data.totalSessions} total`,
        },
        {
          icon: Activity,
          label: "Total tracked",
          value: formatHM(data.totalSeconds),
          sub: "All time",
        },
      ].map((m) => (
        <div
          key={m.label}
          className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <m.icon size={11} className="text-[hsl(var(--muted))]" />
            <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-medium">
              {m.label}
            </p>
          </div>
          <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
            {m.value}
          </p>
          <p className="text-[10px] text-[hsl(var(--muted))]">{m.sub}</p>
        </div>
      ))}

      {data.totalPlannedTasks > 0 && (
        <div className="col-span-2 md:col-span-4 space-y-2 mt-2">
          <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
            Task Completion
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                Completed
              </p>
              <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                {data.totalCompletedTasks}/{data.totalPlannedTasks}
              </p>
            </div>
            <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                Rate
              </p>
              <p
                className={`text-[18px] font-normal ${data.completionPct >= 70 ? "text-[hsl(var(--success))]" : data.completionPct >= 40 ? "text-[hsl(var(--timeline-thinking))]" : "text-[hsl(var(--error))]"}`}
              >
                {data.completionPct}%
              </p>
            </div>
            <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                Avg Mood
              </p>
              <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                {data.avgMood}/5
              </p>
            </div>
            <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                Avg Energy
              </p>
              <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                {data.avgEnergy ? `${Math.round(data.avgEnergy * 10) / 10}/5` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {interruptions.length > 0 && (
        <div className="col-span-2 md:col-span-4 space-y-2 mt-2">
          <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
            Interruption Patterns
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="text-[12px]"
                >
                  {type}: {count}
                </Badge>
              ))}
            {interruptions.length > 0 && (
              <span className="text-[10px] text-[hsl(var(--muted))] self-center">
                (
                {Math.round(
                  interruptions.reduce(
                    (s, i) => s + (i.duration || 0),
                    0,
                  ) / 60,
                )}{" "}
                min total)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
