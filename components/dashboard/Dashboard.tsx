"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  fetchTasks,
  createTask,
  updateTask,
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
} from "@/lib/db-client";
import type { Task, Goal, WeeklyObjective, Session } from "@/lib/types";
import { todayKey, weekStartKey } from "@/lib/utils";
import MetricsBar from "../MetricsBar";
import TodaySummary from "./TodaySummary";
import MetricsPanel from "./MetricsPanel";
import WeeklyObjectivesPanel from "./WeeklyObjectivesPanel";

interface DashboardProps {
  onStartFocus: (taskId?: string, taskName?: string) => void;
}

export default function Dashboard({ onStartFocus }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = todayKey();
  const weekStart = weekStartKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [todayTasks, allGoals, weekObjectives, allSessions] = await Promise.all([
          fetchTasks(today),
          fetchGoals(),
          fetchWeeklyObjectives(weekStart),
          fetchSessions(),
        ]);
        if (cancelled) return;
        setTasks(todayTasks);
        setGoals(allGoals.filter((g) => g.status === "active"));
        setObjectives(weekObjectives);
        setSessions(allSessions);
      } catch (e) {
        if (!cancelled) console.error("Dashboard load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [today, weekStart]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === today),
    [sessions, today],
  );
  const todaySeconds = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.duration, 0),
    [todaySessions],
  );

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  // Goal progress for the week
  const goalProgress = useMemo(() => {
    return goals.slice(0, 3).map((g) => {
      const goalSessions = sessions.filter((s) =>
        s.tags.some((t) => t.toLowerCase() === g.tag.toLowerCase()),
      );
      const weekSeconds = goalSessions
        .filter((s) => s.date >= weekStart)
        .reduce((sum, s) => sum + s.duration, 0);
      const loggedHours = weekSeconds / 3600;
      const pct = g.weeklyTarget > 0
        ? Math.min(100, Math.round((loggedHours / g.weeklyTarget) * 100))
        : 0;
      return { goal: g, loggedHours, pct };
    });
  }, [goals, sessions, weekStart]);

  // Active objectives
  const activeObjectives = useMemo(
    () => objectives.filter((o) => o.status !== "completed").slice(0, 3),
    [objectives],
  );

  // ── Actions ──────────────────────────────────────────────────────────────

  async function addQuickTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    try {
      const task = await createTask({
        objectiveId: null,
        title,
        description: "",
        estimatedTime: 0,
        priority: "medium",
        status: "pending",
        scheduledDate: today,
        scheduledTime: "",
        tags: [],
        checklist: [],
        sessionId: null,
        pomodoroCount: 0,
      });
      setTasks((prev) => [...prev, task]);
      setNewTaskTitle("");
    } catch (e) {
      console.error("Failed to add task:", e);
    }
  }

  async function cycleStatus(task: Task) {
    const next = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
    await updateTask(task.id, { status: next });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  }

  async function startTask(task: Task) {
    if (task.status === "pending") {
      await updateTask(task.id, { status: "in-progress" });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "in-progress" } : t)));
    }
    setActiveTaskId(task.id);
    onStartFocus(task.id, task.title);
  }

  const objectiveMap = useMemo(() => {
    const map = new Map<string, { objective: WeeklyObjective; goal: Goal }>();
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId);
      if (goal) map.set(obj.id, { objective: obj, goal });
    }
    return map;
  }, [objectives, goals]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MetricsBar />

      <TodaySummary
        completedCount={completedTasks.length}
        totalCount={tasks.length}
        totalSeconds={todaySeconds}
        pendingTasks={pendingTasks}
        completedTasks={completedTasks}
        activeTaskId={activeTaskId}
        objectiveMap={objectiveMap}
        newTaskTitle={newTaskTitle}
        onNewTaskTitleChange={setNewTaskTitle}
        onAddQuickTask={addQuickTask}
        onCycleStatus={cycleStatus}
        onStartTask={startTask}
      />

      <MetricsPanel goalProgress={goalProgress} />

      <WeeklyObjectivesPanel objectives={activeObjectives} goals={goals} />
    </div>
  );
}
