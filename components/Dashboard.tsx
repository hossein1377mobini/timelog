"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Play,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  fetchTasks,
  createTask,
  updateTask,
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
} from "@/lib/db-client";
import type { Task, Goal, WeeklyObjective, Session } from "@/lib/types";
import { todayKey, weekStartKey, formatHM } from "@/lib/utils";
import MetricsBar from "./MetricsBar";

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
  const progressPct =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

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
      {/* Stats */}
      <MetricsBar />

      {/* Today summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                My Day
              </p>
              <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                {completedTasks.length}/{tasks.length} tasks · {formatHM(todaySeconds)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--primary))] rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[12px] font-medium text-[hsl(var(--muted))] tabular-nums">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Quick add */}
          <div className="flex gap-2 mb-3">
            <Input
                          value={newTaskTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addQuickTask()}
                          placeholder="Add a task for today..."
                          className="h-9 text-[13px] flex-1"
                        />
            <Button
              size="sm"
              onClick={addQuickTask}
              className="h-9 px-3 shrink-0"
              disabled={!newTaskTitle.trim()}
            >
              <Plus size={14} />
            </Button>
          </div>

          {/* Task list */}
          <div className="space-y-1.5">
            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[13px] text-[hsl(var(--muted))]">
                  No tasks yet. Add one above or plan your day in the Plan tab.
                </p>
              </div>
            )}

            {pendingTasks.map((task) => {
              const objInfo = task.objectiveId ? objectiveMap.get(task.objectiveId) : null;
              const isActive = activeTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 rounded-[8px] border px-3 py-2.5 transition-all ${
                    isActive
                      ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                      : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                  }`}
                >
                  <button
                    onClick={() => cycleStatus(task)}
                    className="w-5 h-5 rounded-full border-2 border-[hsl(var(--hairline-strong))] shrink-0 flex items-center justify-center transition-colors hover:border-[hsl(var(--primary))]"
                  >
                    {task.status === "in-progress" && (
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${task.status === "completed" ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"}`}>
                      {task.title}
                    </p>
                    {objInfo && (
                      <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                        {objInfo.goal.name} → {objInfo.objective.title}
                      </p>
                    )}
                  </div>

                  {task.estimatedTime > 0 && (
                    <span className="text-[10px] text-[hsl(var(--muted))] shrink-0 flex items-center gap-0.5">
                      <Clock size={10} /> {task.estimatedTime}m
                    </span>
                  )}

                  {task.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startTask(task)}
                      className="h-7 px-2 shrink-0 text-[hsl(var(--primary))]"
                    >
                      <Play size={12} fill="currentColor" />
                    </Button>
                  )}
                </div>
              );
            })}

            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]/50 px-3 py-2.5"
              >
                <button
                  onClick={() => cycleStatus(task)}
                  className="w-5 h-5 rounded-full bg-[hsl(var(--success))] shrink-0 flex items-center justify-center"
                >
                  <Check size={11} className="text-white" />
                </button>
                <p className="flex-1 text-[13px] line-through text-[hsl(var(--muted))] truncate">
                  {task.title}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal progress this week */}
      {goalProgress.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              This Week{'\u2019'}s Goals
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
                    style={{ width: `${pct}%`, background: goal.color === "Teal" ? "#0F6E56" : goal.color === "Purple" ? "#534AB7" : goal.color === "Amber" ? "#854F0B" : goal.color === "Blue" ? "#185FA5" : goal.color === "Coral" ? "#993C1D" : "#6B7280" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active objectives */}
      {activeObjectives.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              Weekly Objectives
            </p>
            {activeObjectives.map((obj) => {
              const goal = goals.find((g) => g.id === obj.goalId);
              return (
                <div key={obj.id} className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: goal?.color === "Teal" ? "#0F6E56" : goal?.color === "Purple" ? "#534AB7" : goal?.color === "Amber" ? "#854F0B" : goal?.color === "Blue" ? "#185FA5" : goal?.color === "Coral" ? "#993C1D" : "#6B7280" }}
                  />
                  <span className="text-[12px] text-[hsl(var(--body))] truncate flex-1">
                    {obj.title}
                  </span>
                  <ChevronRight size={12} className="text-[hsl(var(--muted))] shrink-0" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
