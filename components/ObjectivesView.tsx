"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Check, ArrowRight, CalendarDays } from "lucide-react";
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
  createWeeklyObjective,
  updateWeeklyObjective,
  fetchRoadmapTree,
} from "@/lib/db-client";
import type { Goal, WeeklyObjective, RoadmapTree } from "@/lib/types";
import { weekStartKey, weekEndKey, weekLabel, formatHM, todayKey } from "@/lib/utils";
import YearGrid from "./objectives/YearGrid";
import AddObjectiveSheet from "./objectives/AddObjectiveSheet";
import WeeklyReflection from "./objectives/WeeklyReflection";

interface ObjectiveWithGoal extends WeeklyObjective {
  goal: Goal | undefined;
}

export default function ObjectivesView() {
  const weekKey = weekStartKey();
  const weekEnd = weekEndKey();
  const today = todayKey();

  // ── Data state ──
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [roadmapTrees, setRoadmapTrees] = useState<Record<string, RoadmapTree>>({});
  const [loading, setLoading] = useState(true);

  // ── UI state ──
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [yearWeeks, setYearWeeks] = useState<Array<{
    weekStart: string;
    weekEnd: string;
    total: number;
    completed: number;
  }>>([]);

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const [g, o, s] = await Promise.all([
        fetchGoals(),
        fetchWeeklyObjectives(weekKey),
        fetchSessions(),
      ]);
      setGoals(g);
      setObjectives(o);
      setSessions(s);

      // Load roadmap trees for active goals
      const activeGoals = g.filter((goal) => goal.status === "active");
      const trees: Record<string, RoadmapTree> = {};
      for (const goal of activeGoals) {
        trees[goal.id] = await fetchRoadmapTree(goal.id);
      }
      setRoadmapTrees(trees);
    } catch (e) {
      console.error("Failed to load objectives data:", e);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Year data (compute from all objectives) ──
  useEffect(() => {
    // Fetch all objectives to build the year grid
    // For now, we'll build it from the sessions data we have
    // In a real app, we'd have a separate API for this
    fetchWeeklyObjectives().then((allObjs) => {
      const weekMap = new Map<string, { total: number; completed: number }>();

      // Initialize all 52 weeks
      const now = new Date();
      const currentWeek = new Date(weekStartKey(now));
      for (let i = 0; i < 52; i++) {
        const start = new Date(currentWeek);
        start.setDate(start.getDate() - i * 7);
        const key = weekStartKey(start);
        weekMap.set(key, { total: 0, completed: 0 });
      }

      // Populate from objectives
      for (const obj of allObjs) {
        const existing = weekMap.get(obj.weekStart) || { total: 0, completed: 0 };
        existing.total++;
        if (obj.status === "completed") existing.completed++;
        weekMap.set(obj.weekStart, existing);
      }

      const weeksArray = Array.from(weekMap.entries())
        .map(([weekStart, data]) => ({
          weekStart,
          weekEnd: weekEndKey(new Date(weekStart)),
          ...data,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      setYearWeeks(weeksArray);
    }).catch(console.error);
  }, []);

  // ── Derived data ──
  const objectivesWithGoals = useMemo<ObjectiveWithGoal[]>(() => {
    const goalMap = new Map(goals.map((g) => [g.id, g]));
    return objectives.map((o) => ({
      ...o,
      goal: goalMap.get(o.goalId),
    }));
  }, [objectives, goals]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const hasAnyObjectives = objectives.length > 0;

  // Session time for current week
  const weekSessionSeconds = useMemo(() => {
    return sessions
      .filter((s) => s.weekStart === weekKey || s.date >= weekKey && s.date <= weekEnd)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions, weekKey, weekEnd]);

  // ── Handlers ──
  async function handleAddObjective(data: {
    goalId: string;
    milestoneId: string | null;
    title: string;
    description: string;
  }) {
    await createWeeklyObjective({
      goalId: data.goalId,
      milestoneId: data.milestoneId,
      title: data.title,
      description: data.description,
      priority: objectives.filter((o) => o.goalId === data.goalId).length + 1,
      status: "pending",
      weekStart: weekKey,
      weekEnd,
      dailyTaskIds: [],
    });
    await loadData();
  }

  async function cycleStatus(obj: WeeklyObjective) {
    const next: "pending" | "in-progress" | "completed" =
      obj.status === "pending"
        ? "in-progress"
        : obj.status === "in-progress"
        ? "completed"
        : "pending";
    await updateWeeklyObjective(obj.id, { status: next });
    await loadData();
  }

  async function handleEndWeek() {
    // Find unfinished objectives
    const unfinished = objectives.filter((o) => o.status !== "completed");
    setShowWeeklyReflection(true);
  }

  function handleReflectionDone() {
    setShowWeeklyReflection(false);
    loadData();
  }

  function handleReflectionClose() {
    setShowWeeklyReflection(false);
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Weekly Objectives
          </p>
          <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
            {weekLabel()}
          </p>
        </div>
        <Button
          onClick={() => setShowAddSheet(true)}
          className="h-10 text-[13px] gap-1.5"
        >
          <Plus size={14} />
          Add Objective
        </Button>
      </div>

      {/* ── Year Grid ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-medium">Year Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <YearGrid
            weeks={yearWeeks}
            currentWeekStart={weekKey}
            onWeekClick={(ws) => console.log("Week clicked:", ws)}
          />
        </CardContent>
      </Card>

      {/* ── Current Week Objectives ── */}
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const goalObjectives = objectivesWithGoals.filter((o) => o.goalId === goal.id);
            const completedCount = goalObjectives.filter((o) => o.status === "completed").length;

            return (
              <Card key={goal.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                      <span className="text-[13px] font-medium text-[hsl(var(--body-strong))]">
                        {goal.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted))]">
                      {completedCount}/{goalObjectives.length} done
                    </span>
                  </div>

                  {goalObjectives.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-[12px] text-[hsl(var(--muted))]">
                        No objectives for this goal this week
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {goalObjectives.map((obj) => (
                        <div
                          key={obj.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                        >
                          <Button
                            size="sm"
                            variant={
                              obj.status === "completed" ? "default" : "outline"
                            }
                            className={`w-7 h-7 p-0 flex items-center justify-center shrink-0 ${
                              obj.status === "completed"
                                ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90"
                                : ""
                            }`}
                            onClick={() => cycleStatus(obj)}
                          >
                            <Check size={12} className="text-white" />
                          </Button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] truncate ${
                              obj.status === "completed" ? "line-through text-[hsl(var(--muted))]" : "text-[hsl(var(--body-strong))]"
                            }`}>
                              {obj.title}
                            </p>
                            {obj.milestoneId && obj.description && (
                              <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                                {obj.description}
                              </p>
                            )}
                          </div>

                          <span className="text-[9px] uppercase tracking-[0.08em] shrink-0 px-1.5 py-0.5 rounded text-[hsl(var(--muted))] bg-[hsl(var(--surface-strong))]">
                            {obj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <CalendarDays size={32} className="mx-auto text-[hsl(var(--muted))] mb-3" />
            <p className="text-[13px] text-[hsl(var(--muted))] mb-3">
              No active goals yet
            </p>
            <Button onClick={() => setShowAddSheet(true)} variant="outline">
              <Plus size={14} className="mr-1.5" />
              Create a Goal First
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── End This Week ── */}
      <div className="pt-2 pb-4">
        <Button
          onClick={handleEndWeek}
          className="w-full h-11 text-[14px] font-medium"
          variant="outline"
        >
          <Check size={16} className="mr-2" />
          End This Week
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* ── Weekly Reflection ── */}
      {showWeeklyReflection && (
        <WeeklyReflection
          unfinishedObjectives={objectives.filter((o) => o.status !== "completed")}
          weekStart={weekKey}
          weekEnd={weekEnd}
          onDone={handleReflectionDone}
          onClose={handleReflectionClose}
        />
      )}

      {/* ── Add Objective Sheet ── */}
      <AddObjectiveSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAddObjective}
        goals={goals}
        roadmapTrees={roadmapTrees}
        weekKey={weekKey}
        weekEnd={weekEnd}
      />
    </div>
  );
}