"use client";

import { useState, useEffect } from "react";

function safeParseSessions(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatHM(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function getStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [
    ...new Set(sessions.map((s) => new Date(s.startedAt).toDateString())),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b - a);

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i - 1] - days[i]) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function readSessions() {
  if (typeof window === "undefined") return [];
  return safeParseSessions(localStorage.getItem("compass_sessions"));
}

export default function MetricsBar() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    function onStorage() {
      setSessions(readSessions());
    }
    window.addEventListener("storage", onStorage);
    onStorage(); // initial load after mount
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const now = new Date();
  const todaySessions = sessions.filter(
    (s) => new Date(s.startedAt).toDateString() === now.toDateString(),
  );

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekSessions = sessions.filter(
    (s) => new Date(s.startedAt) >= weekStart,
  );

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d >= prevWeekStart && d < weekStart;
  });

  const todaySeconds = todaySessions.reduce((sum, x) => sum + x.duration, 0);
  const weekSeconds = weekSessions.reduce((sum, x) => sum + x.duration, 0);
  const prevWeekSeconds = prevWeekSessions.reduce(
    (sum, x) => sum + x.duration,
    0,
  );
  const weekChange = prevWeekSeconds
    ? Math.round(((weekSeconds - prevWeekSeconds) / prevWeekSeconds) * 100)
    : null;
  const avgSession = weekSessions.length
    ? Math.round(weekSeconds / weekSessions.length / 60)
    : 0;
  const streak = getStreak(sessions);

  const metrics = [
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
