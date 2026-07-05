"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { COLORS } from "../charts/types";
import {
  fetchSessions,
  fetchGoals,
  fetchTasks,
  fetchReflections,
  fetchInterruptions,
} from "@/lib/db-client";
import type {
  Session as DbSession,
  Goal as DbGoal,
  Task as DbTask,
  Reflection as DbReflection,
  Interruption as DbInterruption,
} from "@/lib/types";

/* ───── Helpers ───── */

export function getHours(secs: number) {
  return Math.round((secs / 3600) * 10) / 10;
}

/* ───── Computed analytics shape ───── */

export interface AnalyticsData {
  tagTotals: Record<string, number>;
  sortedTags: [string, number][];
  pieData: { label: string; value: number; color: string }[];
  dailyTotals: Record<string, number>;
  lineData: { label: string; value: number }[];
  barData: { label: string; value: number; color: string }[];
  dailyHours: Record<string, number>;
  scatterData: { x: number; y: number }[];
  totalSessions: number;
  totalSeconds: number;
  avgSessionSeconds: number;
  timeBuckets: { Morning: number; Afternoon: number; Evening: number; Night: number };
  bestTime: string;
  dayTotals: Record<string, number>;
  bestDay: string;
  typeCounts: Record<string, number>;
  totalPlannedTasks: number;
  totalCompletedTasks: number;
  completionPct: number;
  moodTrend: { label: string; mood: number; energy: number }[];
  avgMood: number;
  avgEnergy: number;
  goalProgress: (DbGoal & { logged: number; pct: number })[];
  monthlyTotals: Record<string, number>;
  monthlyData: [string, number][];
}

/* ───── Computation ───── */

export function computeAnalytics(
  sessions: DbSession[],
  goals: DbGoal[],
  reflections: DbReflection[],
  tasks: DbTask[],
  interruptions: DbInterruption[],
): AnalyticsData {
  const tagTotals: Record<string, number> = {};
  sessions.forEach((s) =>
    s.tags.forEach((t) => {
      tagTotals[t] = (tagTotals[t] || 0) + s.duration;
    }),
  );
  const sortedTags = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);

  const pieData = sortedTags.slice(0, 6).map(([label, value], i) => ({
    label,
    value,
    color: COLORS[i % COLORS.length] ?? "#888",
  }));
  if (sortedTags.length > 6) {
    const rest = sortedTags.slice(6).reduce((s, [, v]) => s + v, 0);
    pieData.push({
      label: "Other",
      value: rest,
      color: COLORS[COLORS.length - 1] ?? "#888",
    });
  }

  const dailyTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt).toISOString().split("T")[0] ?? "";
    dailyTotals[d] = (dailyTotals[d] || 0) + s.duration;
  });
  const lineData: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0] ?? "";
    lineData.push({ label: format(d, "EEE")[0] ?? "", value: dailyTotals[key] || 0 });
  }

  const barData = sortedTags.slice(0, 8).map(([label, value], i) => ({
    label: label.replace("#", "").slice(0, 5),
    value,
    color: COLORS[i % COLORS.length] ?? "#888",
  }));

  const dailyHours: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt).toISOString().split("T")[0] ?? "";
    dailyHours[d] = (dailyHours[d] || 0) + s.duration;
  });

  // Scatter: mood vs hours — from reflection data
  const scatterData: { x: number; y: number }[] = [];
  reflections.forEach((r) => {
    const date = r.date;
    const hours = date ? (dailyHours[date] || 0) / 3600 : 0;
    if (r.mood > 0) scatterData.push({ x: r.mood, y: hours });
  });

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((s, x) => s + x.duration, 0);
  const avgSessionSeconds = totalSessions
    ? Math.round(totalSeconds / totalSessions)
    : 0;

  const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  sessions.forEach((s) => {
    const h = new Date(s.startedAt).getHours();
    if (h < 12) timeBuckets.Morning += s.duration;
    else if (h < 17) timeBuckets.Afternoon += s.duration;
    else if (h < 21) timeBuckets.Evening += s.duration;
    else timeBuckets.Night += s.duration;
  });
  const bestTime =
    Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const dayTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = format(new Date(s.startedAt), "EEEE");
    dayTotals[day] = (dayTotals[day] || 0) + s.duration;
  });
  const bestDay =
    Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const typeCounts: Record<string, number> = {};
  interruptions.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });

  // Task completion from tasks table
  let totalPlannedTasks = 0,
    totalCompletedTasks = 0;
  tasks.forEach((t) => {
    totalPlannedTasks++;
    if (t.status === "completed") totalCompletedTasks++;
  });

  // Mood/energy trend from reflections
  const moodTrend: { label: string; mood: number; energy: number }[] = [];
  reflections
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .forEach((r) => {
      moodTrend.push({
        label: format(new Date(r.date), "d/M"),
        mood: r.mood,
        energy: 0,
      });
    });

  const completionPct = totalPlannedTasks
    ? Math.round((totalCompletedTasks / totalPlannedTasks) * 100)
    : 0;
  const avgMood = moodTrend.length
    ? Math.round(
        (moodTrend.reduce((s, m) => s + m.mood, 0) / moodTrend.length) * 10,
      ) / 10
    : 0;
  const avgEnergy = 0;

  const goalProgress = goals.map((g) => {
    const secs = sessions
      .filter((s) =>
        s.tags.map((t) => t.toLowerCase()).includes(g.tag.toLowerCase()),
      )
      .reduce((sum, s) => sum + s.duration, 0);
    return {
      ...g,
      logged: secs / 3600,
      pct: Math.min(100, Math.round((secs / 3600 / g.targetHours) * 100)),
    };
  });

  const monthlyTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + s.duration;
  });
  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return {
    tagTotals,
    sortedTags,
    pieData,
    dailyTotals,
    lineData,
    barData,
    dailyHours,
    scatterData,
    totalSessions,
    totalSeconds,
    avgSessionSeconds,
    timeBuckets,
    bestTime,
    dayTotals,
    bestDay,
    typeCounts,
    totalPlannedTasks,
    totalCompletedTasks,
    completionPct,
    moodTrend,
    avgMood,
    avgEnergy,
    goalProgress,
    monthlyTotals,
    monthlyData,
  };
}

/* ───── Hook ───── */

export function useAnalyticsData(): AnalyticsData & {
  sessions: DbSession[];
  goals: DbGoal[];
  reflections: DbReflection[];
  interruptions: DbInterruption[];
} {
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [goals, setGoals] = useState<DbGoal[]>([]);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [reflections, setReflections] = useState<DbReflection[]>([]);
  const [interruptions, setInterruptions] = useState<DbInterruption[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, g, t, r, i] = await Promise.all([
        fetchSessions(),
        fetchGoals(),
        fetchTasks(),
        fetchReflections(),
        fetchInterruptions(),
      ]);
      setSessions(s);
      setGoals(g);
      setTasks(t);
      setReflections(r);
      setInterruptions(i);
    } catch (e) {
      console.error("Failed to load analytics data:", e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = computeAnalytics(sessions, goals, reflections, tasks, interruptions);
  return { ...analytics, sessions, goals, reflections, interruptions };
}
