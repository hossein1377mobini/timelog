"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchSessions, fetchWeeklyObjectives } from "@/lib/db-client";
import { weekStartKey, weekLabel, formatHM } from "@/lib/utils";
import type { Session, WeeklyObjective } from "@/lib/types";

interface WeekSummary {
  weekStart: string;
  label: string;
  sessions: Session[];
  objectives: WeeklyObjective[];
  totalSeconds: number;
}

export default function YearlyWeeklyCalendar() {
  const [selectedWeek, setSelectedWeek] = useState(weekStartKey());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);

  const year = new Date().getFullYear();

  useEffect(() => {
    // Load all sessions for the year
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`;
    Promise.all([
      fetchSessions(),
      fetchWeeklyObjectives(),
    ])
      .then(([s, o]) => {
        setSessions(s);
        setObjectives(o);
      })
      .catch(console.error);
  }, [year]);

  // Generate all weeks of the year
  const weeks = useMemo(() => {
    const result: WeekSummary[] = [];
    const jan1 = new Date(year, 0, 1);
    // Find the Monday of the week containing Jan 1
    const firstMonday = new Date(jan1);
    const dayOfWeek = jan1.getDay();
    const diff = firstMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    firstMonday.setDate(diff);
    firstMonday.setHours(0, 0, 0, 0);

    for (let w = 0; w < 53; w++) {
      const ws = new Date(firstMonday);
      ws.setDate(ws.getDate() + w * 7);
      const wsKey = ws.toISOString().slice(0, 10);

      // Skip if completely in next year
      if (ws.getFullYear() > year) break;

      const weekSessions = sessions.filter((s) => {
        const sd = new Date(s.startedAt);
        const we = new Date(ws);
        we.setDate(we.getDate() + 7);
        return sd >= ws && sd < we;
      });

      const totalSeconds = weekSessions.reduce(
        (sum, s) => sum + s.duration,
        0,
      );

      const weekObjectives = objectives.filter((o) => o.weekStart === wsKey);

      result.push({
        weekStart: wsKey,
        label: weekLabel(ws),
        sessions: weekSessions,
        objectives: weekObjectives,
        totalSeconds,
      });
    }
    return result;
  }, [sessions, objectives, year]);

  const currentWeekKey = weekStartKey();
  const selectedData = weeks.find((w) => w.weekStart === selectedWeek);
  const selectedIndex = weeks.findIndex((w) => w.weekStart === selectedWeek);

  function intensity(totalSeconds: number): string {
    const hours = totalSeconds / 3600;
    if (hours === 0) return "bg-[hsl(var(--surface-strong))]";
    if (hours < 2) return "bg-[hsl(var(--timeline-read))]";
    if (hours < 5) return "bg-[hsl(var(--timeline-grep))]";
    if (hours < 10) return "bg-[hsl(var(--primary))]/60";
    return "bg-[hsl(var(--primary))]";
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[hsl(var(--muted))]" />
            Yearly Calendar
            <span className="text-[12px] font-normal text-[hsl(var(--muted))] ml-1">
              {year}
            </span>
          </CardTitle>
          {selectedData && (
            <span className="text-[11px] text-[hsl(var(--muted))] tabular-nums">
              {selectedData.label}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10px,1fr))] gap-1.5">
          {weeks.map((w, i) => {
            const isCurrent = w.weekStart === currentWeekKey;
            const isSelected = w.weekStart === selectedWeek;
            return (
              <button
                key={w.weekStart}
                onClick={() => setSelectedWeek(w.weekStart)}
                title={`${w.label}: ${formatHM(w.totalSeconds)}, ${w.sessions.length} sessions, ${w.objectives.length} objectives`}
                className={[
                  "w-3 h-3 rounded-sm transition-all",
                  intensity(w.totalSeconds),
                  isSelected ? "ring-2 ring-[hsl(var(--primary))] ring-offset-1 ring-offset-[hsl(var(--surface-card))]" : "",
                  isCurrent && !isSelected ? "ring-1 ring-[hsl(var(--hairline-strong))]" : "",
                  "hover:scale-125 cursor-pointer",
                ].join(" ")}
              >
                {w.totalSeconds > 0 && (
                  <span className="sr-only">{formatHM(w.totalSeconds)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll through weeks */}
        {selectedData && (
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                selectedIndex > 0 &&
                setSelectedWeek(weeks[selectedIndex - 1]!.weekStart)
              }
              disabled={selectedIndex <= 0}
              className="text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous week
            </button>

            <div className="space-y-1 text-center">
              <p className="text-[15px] font-medium text-[hsl(var(--body-strong))]">
                {formatHM(selectedData.totalSeconds)}
              </p>
              <p className="text-[11px] text-[hsl(var(--muted))]">
                {selectedData.sessions.length} sessions ·{" "}
                {selectedData.objectives.filter((o) => o.status === "completed")
                  .length}
                /{selectedData.objectives.length} objectives
              </p>
            </div>

            <button
              onClick={() =>
                selectedIndex < weeks.length - 1 &&
                setSelectedWeek(weeks[selectedIndex + 1]!.weekStart)
              }
              disabled={selectedIndex >= weeks.length - 1}
              className="text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors disabled:opacity-30 flex items-center gap-1"
            >
              Next week <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Week legend */}
        <div className="flex items-center gap-3 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[hsl(var(--surface-strong))]" />
            <span className="text-[10px] text-[hsl(var(--muted))]">0h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[hsl(var(--timeline-read))]" />
            <span className="text-[10px] text-[hsl(var(--muted))]">&lt;2h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[hsl(var(--timeline-grep))]" />
            <span className="text-[10px] text-[hsl(var(--muted))]">&lt;5h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[hsl(var(--primary))]/60" />
            <span className="text-[10px] text-[hsl(var(--muted))]">&lt;10h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[hsl(var(--primary))]" />
            <span className="text-[10px] text-[hsl(var(--muted))]">10h+</span>
          </div>
        </div>

        {/* Selected week objectives */}
        {selectedData && selectedData.objectives.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--hairline))]">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-semibold">
              Objectives
            </p>
            {selectedData.objectives.map((obj) => (
              <div key={obj.id} className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    obj.status === "completed"
                      ? "bg-[hsl(var(--success))]"
                      : obj.status === "in-progress"
                        ? "bg-[hsl(var(--warning))]"
                        : "bg-[hsl(var(--muted))]"
                  }`}
                />
                <span
                  className={`text-[12px] truncate ${
                    obj.status === "completed"
                      ? "line-through text-[hsl(var(--muted))]"
                      : "text-[hsl(var(--body))]"
                  }`}
                >
                  {obj.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
