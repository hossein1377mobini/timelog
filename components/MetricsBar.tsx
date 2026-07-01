"use client";

import { useState, useEffect } from "react";
import { getSessions } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { formatHM } from "@/lib/utils";
import { currentStreak, sessionsOnDate, sessionsThisWeek, totalDuration } from "@/lib/analytics";

interface Metric {
  label: string;
  value: string;
  sub: string;
  green?: boolean;
}

export default function MetricsBar() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    function onStorage() {
      setSessions(getSessions());
    }
    window.addEventListener("compass-storage-update", onStorage);
    onStorage();
    return () => window.removeEventListener("compass-storage-update", onStorage);
  }, []);

  const now = new Date();
  const todaySessions = sessionsOnDate(sessions, now);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekSessions = sessionsThisWeek(sessions);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= prevWeekStart && d < weekStart;
  });

  const todaySeconds = totalDuration(todaySessions);
  const weekSeconds = totalDuration(weekSessions);
  const prevWeekSeconds = totalDuration(prevWeekSessions);
  const weekChange = prevWeekSeconds
    ? Math.round(((weekSeconds - prevWeekSeconds) / prevWeekSeconds) * 100)
    : null;
  const avgSession = weekSessions.length
    ? Math.round(weekSeconds / weekSessions.length / 60)
    : 0;
  const streak = currentStreak(sessions);

  const metrics: Metric[] = [
    {
      label: "Today",
      value: todaySeconds ? formatHM(todaySeconds) : "0m",
      sub: `${todaySessions.length} session${todaySessions.length !== 1 ? "s" : ""}`,
    },
    {
      label: "This week",
      value: weekSeconds ? formatHM(weekSeconds) : "0m",
      sub:
        weekChange !== null
          ? `${weekChange >= 0 ? "+" : ""}${weekChange}% vs last week`
          : "no data last week",
      green: weekChange !== null && weekChange > 0,
    },
    {
      label: "Avg session",
      value: avgSession ? `${avgSession}m` : "—",
      sub: `${weekSessions.length} this week`,
    },
    {
      label: "Streak",
      value: streak ? `${streak} day${streak !== 1 ? "s" : ""}` : "—",
      sub: "consecutive days",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-[hsl(var(--surface-card))] rounded-xl border border-[hsl(var(--hairline))] px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-1">
            {m.label}
          </p>
          <p
            className={`text-[22px] font-normal leading-[1.3] tracking-[-0.11px] mb-1 ${m.green ? "text-[hsl(var(--success))]" : "text-[hsl(var(--body-strong))]"}`}
          >
            {m.value}
          </p>
          <p className="text-[11px] text-[hsl(var(--muted))]">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}