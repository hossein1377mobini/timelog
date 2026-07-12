"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays } from "lucide-react";
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchSessions,
  createWeeklyObjective,
  updateWeeklyObjective,
  deleteWeeklyObjective,
  createTask,
  updateTask,
  fetchTasks,
} from "@/lib/db-client";
import type { Goal, WeeklyObjective, Session, TaskStatus } from "@/lib/types";
import { weekStartKey, weekEndKey, weekLabel, todayKey } from "@/lib/utils";
import { buildLoggedByTag } from "./weekly-plan/weeklyPlanHelpers";
import { EmptyState } from "./weekly-plan/EmptyState";
import { GoalSection } from "./weekly-plan/GoalSection";
import { WizardStep1 } from "./weekly-plan/WizardStep1";
import { WizardStep2 } from "./weekly-plan/WizardStep2";

// ── Types ────────────────────────────────────────────────────────────────────

interface GoalGroup {
  goal: Goal;
  objectives: WeeklyObjective[];
  logged: number;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WeeklyPlan() {
  // ── Data state ──
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // ── Card UI state ──
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // ── Wizard dialog state ──
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [hourTargets, setHourTargets] = useState<Record<string, number>>({});
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null); // step-2 active goal

  // ── Inline "add objective" state ──
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null);
  const [newObjTitle, setNewObjTitle] = useState("");
  const [newObjDesc, setNewObjDesc] = useState("");

  // ── Edit objective dialog ──
  const [editingObj, setEditingObj] = useState<WeeklyObjective | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // ── Add daily task dialog ──
  const [addTaskObj, setAddTaskObj] = useState<WeeklyObjective | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const weekKey = weekStartKey();
  const weekEnd = weekEndKey();

  // ── Storage sync ────────────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [g, o, s] = await Promise.all([
        fetchGoals(),
        fetchWeeklyObjectives(weekKey),
        fetchSessions(),
      ]);
      setGoals(g);
      setObjectives(o);
      setSessions(s);
    } catch (e) {
      console.error("Failed to load weekly plan data:", e);
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const loggedByTag = useMemo(() => buildLoggedByTag(sessions), [sessions]);

  const goalGroups = useMemo<GoalGroup[]>(() => {
    return goals
      .filter((g) => g.status === "active")
      .map((goal) => ({
        goal,
        objectives: objectives.filter((o) => o.goalId === goal.id),
        logged: loggedByTag[goal.tag.toLowerCase()] ?? 0,
      }))
      .filter((g) => g.objectives.length > 0);
  }, [goals, objectives, loggedByTag]);

  // ── Wizard helpers ────────────────────────────────────────────────────────────

  function openWizard() {
    const existingGoalIds = [...new Set(objectives.map((o) => o.goalId))];
    setSelectedGoalIds(existingGoalIds);
    const ht: Record<string, number> = {};
    existingGoalIds.forEach((id) => {
      const g = goals.find((x) => x.id === id);
      ht[id] = g?.weeklyTarget || 5;
    });
    setHourTargets(ht);
    setWizardStep(1);
    setFocusedGoalId(existingGoalIds[0] ?? null);
    setWizardOpen(true);
  }

  function toggleGoalSelection(id: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    if (!hourTargets[id]) {
      const g = goals.find((x) => x.id === id);
      setHourTargets((prev) => ({ ...prev, [id]: g?.weeklyTarget || 5 }));
    }
  }

  function goToStep2() {
    if (selectedGoalIds.length === 0) return;
    setFocusedGoalId(selectedGoalIds[0] ?? null);
    setWizardStep(2);
  }

  async function closeWizard() {
    setWizardOpen(false);
    setAddingToGoalId(null);
    setNewObjTitle("");
    setNewObjDesc("");
    await loadData();
  }

  // ── Objective CRUD ────────────────────────────────────────────────────────────

  async function addObjective(goalId: string) {
    const title = newObjTitle.trim();
    if (!title) return;
    await createWeeklyObjective({
      goalId,
      milestoneId: null,
      title,
      description: newObjDesc.trim(),
      priority: objectives.filter((o) => o.goalId === goalId).length + 1,
      status: "pending",
      weekStart: weekKey,
      weekEnd,
      dailyTaskIds: [],
    });
    setNewObjTitle("");
    setNewObjDesc("");
    setAddingToGoalId(null);
    await loadData();
  }

  async function cycleStatus(obj: WeeklyObjective) {
    const next: TaskStatus =
      obj.status === "pending"
        ? "in-progress"
        : obj.status === "in-progress"
          ? "completed"
          : "pending";
    await updateWeeklyObjective(obj.id, { status: next });
    await loadData();
  }

  function openEdit(obj: WeeklyObjective) {
    setEditingObj(obj);
    setEditTitle(obj.title);
    setEditDesc(obj.description);
  }

  async function saveEdit() {
    if (!editingObj || !editTitle.trim()) return;
    await updateWeeklyObjective(editingObj.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setEditingObj(null);
    await loadData();
  }

  async function deleteObj(id: string) {
    await deleteWeeklyObjective(id);
    await loadData();
  }

  // ── Daily task quick-add ──────────────────────────────────────────────────────

  async function addDailyTask() {
    if (!addTaskObj || !newTaskTitle.trim()) return;
    const task = await createTask({
      objectiveId: addTaskObj.id,
      title: newTaskTitle.trim(),
      description: "",
      estimatedTime: 0,
      priority: "medium",
      status: "pending",
      scheduledDate: todayKey(),
      scheduledTime: "",
      tags: [],
      checklist: [],
      sessionId: null,
      pomodoroCount: 0,
    });
    // link task to objective
    await updateWeeklyObjective(addTaskObj.id, {
      dailyTaskIds: [...addTaskObj.dailyTaskIds, task.id],
    });
    setNewTaskTitle("");
    setAddTaskObj(null);
    await loadData();
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Main card ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <CalendarDays size={14} className="text-[hsl(var(--muted))]" />
              Weekly plan
              <span className="text-[12px] font-normal text-[hsl(var(--muted))] ml-1">
                {weekLabel()}
              </span>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={openWizard}
              className="h-7 text-[12px] px-3 transition-all hover:scale-[1.01] active:scale-[0.97]"
            >
              {objectives.length > 0 ? "Edit plan" : "Set up week"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {goalGroups.length === 0 ? (
            <EmptyState onOpen={openWizard} />
          ) : (
            <div className="space-y-3">
              {goalGroups.map(({ goal, objectives: objs, logged }) => (
                <GoalSection
                  key={goal.id}
                  goal={goal}
                  objectives={objs}
                  logged={logged}
                  expanded={expanded[goal.id] !== false}
                  onToggleExpand={() =>
                    setExpanded((p) => ({
                      ...p,
                      [goal.id]: expanded[goal.id] === false,
                    }))
                  }
                  onCycleStatus={cycleStatus}
                  onEdit={openEdit}
                  onDelete={deleteObj}
                  onAddTask={(obj) => {
                    setAddTaskObj(obj);
                    setNewTaskTitle("");
                  }}
                  addingToGoalId={addingToGoalId}
                  newObjTitle={newObjTitle}
                  newObjDesc={newObjDesc}
                  onOpenAddForm={() => {
                    setAddingToGoalId(goal.id);
                    setNewObjTitle("");
                    setNewObjDesc("");
                  }}
                  onCancelAddForm={() => setAddingToGoalId(null)}
                  onChangeTitle={setNewObjTitle}
                  onChangeDesc={setNewObjDesc}
                  onAddObjective={addObjective}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Setup / Edit wizard ── */}
      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          if (!open) closeWizard();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
          {wizardStep === 1 ? (
            <WizardStep1
              goals={goals}
              selectedGoalIds={selectedGoalIds}
              hourTargets={hourTargets}
              onToggleGoal={toggleGoalSelection}
              onChangeHours={(id, val) =>
                setHourTargets((p) => ({ ...p, [id]: val }))
              }
              onCancel={closeWizard}
              onContinue={goToStep2}
            />
          ) : (
            <WizardStep2
              goals={goals.filter((g) => selectedGoalIds.includes(g.id))}
              objectives={objectives}
              focusedGoalId={focusedGoalId}
              weekKey={weekKey}
              weekEnd={weekEnd}
              onFocusGoal={setFocusedGoalId}
              onBack={() => setWizardStep(1)}
              onDone={closeWizard}
              onAddObjective={async (goalId, title, desc) => {
                              await createWeeklyObjective({
                                goalId,
                                milestoneId: null,
                                title,
                                description: desc,
                                priority:
                                  objectives.filter((o) => o.goalId === goalId).length + 1,
                                status: "pending",
                                weekStart: weekKey,
                                weekEnd,
                                dailyTaskIds: [],
                              });
                              await loadData();
                            }}
              onCycleStatus={async (obj) => {
                await cycleStatus(obj);
              }}
              onEditObjective={openEdit}
              onDeleteObjective={deleteObj}
              onAddTask={(obj) => {
                setAddTaskObj(obj);
                setNewTaskTitle("");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit objective dialog ── */}
      <Dialog
        open={editingObj !== null}
        onOpenChange={() => setEditingObj(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              Edit objective
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditTitle(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && saveEdit()
                }
                className="h-9 text-[14px]"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Description
              </label>
              <Textarea
                value={editDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditDesc(e.target.value)
                }
                placeholder="Optional details..."
                className="resize-none h-20 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingObj(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={!editTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add daily task dialog ── */}
      <Dialog
        open={addTaskObj !== null}
        onOpenChange={() => setAddTaskObj(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">
              Add daily task
            </DialogTitle>
          </DialogHeader>
          {addTaskObj && (
            <p className="text-[12px] text-[hsl(var(--muted))] -mt-1 px-1">
              For:{" "}
              <span className="text-[hsl(var(--body-strong))] font-medium">
                {addTaskObj.title}
              </span>
            </p>
          )}
          <div className="space-y-2 py-1">
            <Input
              value={newTaskTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTaskTitle(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && addDailyTask()
              }
              placeholder="Task title..."
              className="h-9 text-[13px]"
              autoFocus
            />
            <p className="text-[11px] text-[hsl(var(--muted))]">
              Task will be scheduled for today and linked to this objective.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddTaskObj(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={addDailyTask}
              disabled={!newTaskTitle.trim()}
            >
              Add task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
