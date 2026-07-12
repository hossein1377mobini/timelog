"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import NightReflection from "@/components/night-reflection";
import TimerSummary from "./TimerSummary";
import TaskListSection from "./TaskListSection";
import QuickActions from "./QuickActions";

interface MyDayProps {
  onStartTimer: (taskId: string, taskName: string) => void;
}

export default function MyDay({ onStartTimer }: MyDayProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNightReflection, setShowNightReflection] = useState(false);

  const today = todayKey();
  const weekStart = weekStartKey();

  const loadData = useMemo(() => async () => {
    try {
      const [todayTasks, allGoals, weekObjectives, allSessions] = await Promise.all([
        fetchTasks(today),
        fetchGoals(),
        fetchWeeklyObjectives(weekStart),
        fetchSessions(),
      ]);
      setTasks(todayTasks);
      setGoals(allGoals.filter((g) => g.status === "active"));
      setObjectives(weekObjectives);
      setSessions(allSessions);
    } catch (e) {
      console.error("MyDay load error:", e);
    } finally {
      setLoading(false);
    }
  }, [today, weekStart]);

  useEffect(() => {
    let cancelled = false;
    loadData().then(() => {});
    return () => { cancelled = true; };
  }, [loadData]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === today),
    [sessions, today],
  );

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  // Session durations per task (taskId → total seconds)
  const taskDurations = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of todaySessions) {
      if (s.taskId) {
        map.set(s.taskId, (map.get(s.taskId) || 0) + s.duration);
      }
    }
    return map;
  }, [todaySessions]);

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

  async function handleComplete(task: Task) {
    await updateTask(task.id, { status: "completed" });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "completed" } : t)));
  }

  async function handleUncomplete(task: Task) {
    await updateTask(task.id, { status: "pending" });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "pending" } : t)));
  }

  // ── Expanded state ────────────────────────────────────────────────────────
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const objectiveMap = useMemo(() => {
    const map = new Map<string, { objective: WeeklyObjective; goal: Goal }>();
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId);
      if (goal) map.set(obj.id, { objective: obj, goal });
    }
    return map;
  }, [objectives, goals]);

  // ── Night Reflection handler ─────────────────────────────────────────────
  function handleEndDay() {
    setShowNightReflection(true);
  }

  function handleNightReflectionDone() {
    setShowNightReflection(false);
    setLoading(true);
    loadData().then(() => {});
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  const totalSeconds = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-4">
      <MetricsBar />

      {/* My Day card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <TimerSummary
            completedCount={completedTasks.length}
            totalCount={tasks.length}
            totalSeconds={totalSeconds}
          />

          <QuickActions
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            addQuickTask={addQuickTask}
            handleEndDay={handleEndDay}
          />

          <TaskListSection
            pendingTasks={pendingTasks}
            completedTasks={completedTasks}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            objectiveMap={objectiveMap}
            taskDurations={taskDurations}
            onStartTimer={onStartTimer}
            handleComplete={handleComplete}
            handleUncomplete={handleUncomplete}
          />
        </CardContent>
      </Card>

      {/* Night Reflection */}
      {showNightReflection && (
        <NightReflection
          unfinishedTasks={pendingTasks}
          today={today}
          tomorrow={todayKey(new Date(Date.now() + 86400000))}
          onDone={handleNightReflectionDone}
          onClose={() => setShowNightReflection(false)}
        />
      )}
    </div>
  );
}
