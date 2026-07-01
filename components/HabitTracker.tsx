"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import { getSessions } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { formatHM } from "@/lib/utils";
import { currentStreak, bestStreak, dailyDurationMap, toYMD, todayKey } from "@/lib/analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function motivationalMessage(streak: number): string {
  if (streak === 0) return "Every expert was once a beginner. Start today! 💪";
  if (streak <= 2) return "You're getting started! Keep it up 🌱";
  if (streak <= 6) return `${streak} days strong! Building momentum 🔥`;
  if (streak <= 13) return "One week+ streak! You're consistent 🎯";
  return `${streak} days! You're unstoppable 🚀`;
}

// Days of week headers, Mon–Sun
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitTracker() {
  const [sessions, setSessions] = useState<Session[]>(() => getSessions());
  const [viewYear, setViewYear] = useState<number>(() =>
    new Date().getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    new Date().getMonth(),
  ); // 0-based
  const [showStats, setShowStats] = useState(false);

  // Re-read sessions on cross-tab storage changes
  useEffect(() => {
    function onStorage() {
      setSessions(getSessions());
    }
    window.addEventListener("compass-storage-update", onStorage);
    onStorage(); // initial load after mount
    return () => window.removeEventListener("compass-storage-update", onStorage);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const activeDays = dailyDurationMap(sessions);
  const curStreak = currentStreak(sessions);
  const bstStreak = bestStreak(sessions);
  const todayStr = todayKey();

  // Month navigation
  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  // Build calendar grid cells for the viewed month
  // Week starts Monday (ISO). day 0 = Monday … 6 = Sunday
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon-based index
  const firstDow = (firstDay.getDay() + 6) % 7; // 0=Mon … 6=Sun

  interface CalCell {
    day: number | null;
    dateStr: string | null;
    isToday: boolean;
    isFuture: boolean;
    hasSession: boolean;
  }

  const cells: CalCell[] = [];
  // Leading empty cells
  for (let i = 0; i < firstDow; i++) {
    cells.push({
      day: null,
      dateStr: null,
      isToday: false,
      isFuture: false,
      hasSession: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; // same format as toYMD
    const isFuture = dateStr > todayStr;
    cells.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      isFuture,
      hasSession: activeDays.has(dateStr),
    });
  }
  // Trailing empty cells to complete last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({
        day: null,
        dateStr: null,
        isToday: false,
        isFuture: false,
        hasSession: false,
      });
    }
  }

  // Stats for the viewed month
  const monthSessionDays = Array.from(activeDays.keys()).filter((d) =>
    d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`),
  ).length;

  // ── Statistics breakdown data ────────────────────────────────────────────────

  const daysWithAny = activeDays.size;

  const daysWithGe1h = Array.from(activeDays.values()).filter(
    (s) => s >= 3600,
  ).length;
  const daysWithGe2h = Array.from(activeDays.values()).filter(
    (s) => s >= 7200,
  ).length;

  // This week Mon–Sun
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dow);
  weekStart.setHours(0, 0, 0, 0);
  let thisWeekDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = toYMD(d); // eslint-disable-line @typescript-eslint/no-unused-vars
    if (key > todayStr) break;
    if (activeDays.has(key)) thisWeekDays++;
  }

  // This month (current real month, not viewed month)
  const realMonthPrefix = todayStr.slice(0, 7);
  const thisMonthDays = Array.from(activeDays.keys()).filter((d) =>
    d.startsWith(realMonthPrefix),
  ).length;
  const daysInCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  // Consistency last 30 days
  let activeLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    if (activeDays.has(toYMD(d))) activeLast30++;
  }
  const consistency30 = Math.round((activeLast30 / 30) * 100);

  // Average daily focus (only over days with sessions)
  const totalSecs = Array.from(activeDays.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const avgDailyFocus =
    activeDays.size > 0 ? totalSecs / activeDays.size : 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[14px] font-medium">
            <Flame className="w-4 h-4 text-[hsl(var(--warning))]" />
            Habit Tracker
          </CardTitle>
          <span className="text-[12px] text-[hsl(var(--muted))]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Month calendar ── */}
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[13px] font-medium text-[hsl(var(--body-strong))]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW_LABELS.map((label) => (
              <div
                key={label}
                className="flex items-center justify-center text-[10px] font-medium text-[hsl(var(--muted))] h-6"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-center h-8"
                  />
                );
              }

              const filled = !cell.isFuture && cell.hasSession;
              const faint = cell.isFuture;

              return (
                <div key={idx} className="flex items-center justify-center">
                  <div
                    title={cell.dateStr ?? undefined}
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center relative transition-colors",
                      filled
                        ? "bg-[hsl(var(--primary))]"
                        : cell.isToday
                          ? "border-2 border-[hsl(var(--primary))] bg-transparent"
                          : faint
                            ? "opacity-25"
                            : "border border-[hsl(var(--hairline))] bg-transparent",
                    ].join(" ")}
                  >
                    {filled ? (
                      <span className="text-[11px] font-semibold text-white leading-none select-none">
                        ✓
                      </span>
                    ) : (
                      <span
                        className={[
                          "text-[11px] leading-none select-none",
                          faint
                            ? "text-[hsl(var(--muted))]"
                            : cell.isToday
                              ? "text-[hsl(var(--primary))] font-semibold"
                              : "text-[hsl(var(--muted))]",
                        ].join(" ")}
                      >
                        {cell.day}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon: "🔥",
              value: `${curStreak} day${curStreak !== 1 ? "s" : ""}`,
              label: "streak",
            },
            {
              icon: "📅",
              value: `${monthSessionDays}/${daysInMonth}`,
              label: "this month",
            },
            {
              icon: "🏆",
              value: `${bstStreak} day${bstStreak !== 1 ? "s" : ""}`,
              label: "best",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5 rounded-lg p-2 bg-[hsl(var(--surface-strong))]"
            >
              <span className="text-base leading-none">{stat.icon}</span>
              <span className="text-[13px] font-semibold text-[hsl(var(--body-strong))] leading-tight">
                {stat.value}
              </span>
              <span className="text-[10px] text-[hsl(var(--muted))] leading-none">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Motivational message ── */}
        <p className="text-[12px] text-center text-[hsl(var(--muted))] leading-snug px-2">
          {motivationalMessage(curStreak)}
        </p>

        {/* ── Collapsible statistics breakdown ── */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between text-[12px] h-8 px-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
            onClick={() => setShowStats((s) => !s)}
          >
            <span>{showStats ? "Hide stats" : "Show stats"}</span>
            {showStats ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>

          {showStats && (
            <div className="mt-2 rounded-lg bg-[hsl(var(--surface-strong))] p-3 space-y-1.5">
              <p className="text-[12px] font-semibold text-[hsl(var(--body-strong))] mb-2">
                📊 Habit Statistics
              </p>
              {[
                { label: "Days with any session", value: `${daysWithAny}` },
                { label: "Days with ≥ 1 hour", value: `${daysWithGe1h}` },
                { label: "Days with ≥ 2 hours", value: `${daysWithGe2h}` },
                {
                  label: "This week (Mon–Sun)",
                  value: `${thisWeekDays}/7 days`,
                },
                {
                  label: "This month",
                  value: `${thisMonthDays}/${daysInCurrentMonth} days`,
                },
                { label: "Consistency (30 days)", value: `${consistency30}%` },
                { label: "Current streak", value: `${curStreak} days 🔥` },
                { label: "Best streak", value: `${bstStreak} days 🏆` },
                {
                  label: "Average daily focus",
                  value: avgDailyFocus > 0 ? formatHM(avgDailyFocus) : "—",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="text-[11px] text-[hsl(var(--muted))] shrink-0">
                    • {row.label}
                  </span>
                  <span className="text-[11px] font-medium text-[hsl(var(--body-strong))] text-right tabular-nums">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
