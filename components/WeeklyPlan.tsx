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
import {
  CalendarDays,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  ArrowLeft,
  ArrowRight,
  Clock,
  ListTodo,
  Target,
} from "lucide-react";
import {
  getGoals,
  getSessions,
  getObjectivesForWeek,
  saveWeeklyObjective,
  updateWeeklyObjective,
  deleteWeeklyObjective,
  getTasksForObjective,
  saveTask,
  dispatchStorageEvent,
} from "@/lib/storage";
import type { Goal, WeeklyObjective, Session, TaskStatus } from "@/lib/types";
import { weekStartKey, weekEndKey, weekLabel, todayKey } from "@/lib/utils";

import { GOAL_COLOR_RECORD } from "@/lib/constants"

// Alias for backward-compat with this file's existing usage pattern
const GOAL_COLORS = GOAL_COLOR_RECORD

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildLoggedByTag(sessions: Session[]): Record<string, number> {
  const map: Record<string, number> = {};
  const ws = weekStartKey();
  for (const s of sessions) {
    if (s.date < ws) continue;
    for (const raw of s.tags) {
      const tag = raw.toLowerCase();
      map[tag] = (map[tag] ?? 0) + s.duration;
    }
  }
  for (const tag of Object.keys(map)) {
    map[tag] = Math.round((map[tag] / 3600) * 10) / 10;
  }
  return map;
}

function statusLabel(status: TaskStatus): string {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In Progress";
  return "Pending";
}

function statusColors(status: TaskStatus): string {
  if (status === "completed")
    return "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]";
  if (status === "in-progress")
    return "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]";
  return "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]";
}

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
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  function loadData() {
    setGoals(getGoals());
    setObjectives(getObjectivesForWeek());
    setSessions(getSessions());
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
    setFocusedGoalId(selectedGoalIds[0]);
    setWizardStep(2);
  }

  function closeWizard() {
    setWizardOpen(false);
    setAddingToGoalId(null);
    setNewObjTitle("");
    setNewObjDesc("");
    loadData();
    dispatchStorageEvent();
  }

  // ── Objective CRUD ────────────────────────────────────────────────────────────

  function addObjective(goalId: string) {
    const title = newObjTitle.trim();
    if (!title) return;
    saveWeeklyObjective({
      goalId,
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
    loadData();
    dispatchStorageEvent();
  }

  function cycleStatus(obj: WeeklyObjective) {
    const next: TaskStatus =
      obj.status === "pending"
        ? "in-progress"
        : obj.status === "in-progress"
          ? "completed"
          : "pending";
    updateWeeklyObjective(obj.id, { status: next });
    loadData();
    dispatchStorageEvent();
  }

  function openEdit(obj: WeeklyObjective) {
    setEditingObj(obj);
    setEditTitle(obj.title);
    setEditDesc(obj.description);
  }

  function saveEdit() {
    if (!editingObj || !editTitle.trim()) return;
    updateWeeklyObjective(editingObj.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setEditingObj(null);
    loadData();
    dispatchStorageEvent();
  }

  function deleteObj(id: string) {
    deleteWeeklyObjective(id);
    loadData();
    dispatchStorageEvent();
  }

  // ── Daily task quick-add ──────────────────────────────────────────────────────

  function addDailyTask() {
    if (!addTaskObj || !newTaskTitle.trim()) return;
    const task = saveTask({
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
    updateWeeklyObjective(addTaskObj.id, {
      dailyTaskIds: [...addTaskObj.dailyTaskIds, task.id],
    });
    setNewTaskTitle("");
    setAddTaskObj(null);
    loadData();
    dispatchStorageEvent();
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
              onAddObjective={(goalId, title, desc) => {
                saveWeeklyObjective({
                  goalId,
                  title,
                  description: desc,
                  priority:
                    objectives.filter((o) => o.goalId === goalId).length + 1,
                  status: "pending",
                  weekStart: weekKey,
                  weekEnd,
                  dailyTaskIds: [],
                });
                loadData();
                dispatchStorageEvent();
              }}
              onCycleStatus={(obj) => {
                cycleStatus(obj);
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
                placeholder="Optional details…"
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
              placeholder="Task title…"
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

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all group"
    >
      <CalendarDays
        size={20}
        className="text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors"
      />
      <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">
        Plan this week
      </p>
      <p className="text-[12px] text-[hsl(var(--muted))] text-center max-w-48">
        Pick goals and set objectives for the week
      </p>
    </div>
  );
}

// ── Goal section (main card body) ─────────────────────────────────────────────

interface GoalSectionProps {
  goal: Goal;
  objectives: WeeklyObjective[];
  logged: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onCycleStatus: (obj: WeeklyObjective) => void;
  onEdit: (obj: WeeklyObjective) => void;
  onDelete: (id: string) => void;
  onAddTask: (obj: WeeklyObjective) => void;
  addingToGoalId: string | null;
  newObjTitle: string;
  newObjDesc: string;
  onOpenAddForm: () => void;
  onCancelAddForm: () => void;
  onChangeTitle: (v: string) => void;
  onChangeDesc: (v: string) => void;
  onAddObjective: (goalId: string) => void;
}

function GoalSection({
  goal,
  objectives,
  logged,
  expanded,
  onToggleExpand,
  onCycleStatus,
  onEdit,
  onDelete,
  onAddTask,
  addingToGoalId,
  newObjTitle,
  newObjDesc,
  onOpenAddForm,
  onCancelAddForm,
  onChangeTitle,
  onChangeDesc,
  onAddObjective,
}: GoalSectionProps) {
  const color = GOAL_COLORS[goal.color] || GOAL_COLORS.Purple;
  const pct = Math.min(
    100,
    Math.round((logged / (goal.weeklyTarget || 1)) * 100),
  );
  const doneCount = objectives.filter((o) => o.status === "completed").length;
  const inProgressCount = objectives.filter(
    (o) => o.status === "in-progress",
  ).length;
  const isAddingHere = addingToGoalId === goal.id;

  return (
    <div className="border border-[hsl(var(--hairline))] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-3 hover:bg-[hsl(var(--canvas-soft))] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-medium text-[hsl(var(--body-strong))] truncate">
              {goal.name}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${color.cat}`}
            >
              {goal.tag}
            </span>
            {inProgressCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium shrink-0">
                {inProgressCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color.bar }}
              />
            </div>
            <span className="text-[10px] text-[hsl(var(--muted))] whitespace-nowrap">
              {logged}h / {goal.weeklyTarget}h
            </span>
            {objectives.length > 0 && (
              <span className="text-[10px] text-[hsl(var(--muted))] whitespace-nowrap">
                {doneCount}/{objectives.length} obj
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[hsl(var(--muted))] shrink-0" />
        ) : (
          <ChevronDown
            size={14}
            className="text-[hsl(var(--muted))] shrink-0"
          />
        )}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[hsl(var(--hairline))] px-3 pb-3 pt-2 space-y-2 bg-[hsl(var(--canvas-soft))]/40">
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              obj={obj}
              color={color}
              onCycleStatus={onCycleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddTask={onAddTask}
            />
          ))}

          {/* Inline add form */}
          {isAddingHere ? (
            <div className="border border-[hsl(var(--hairline-strong))] rounded-lg p-3 space-y-2 bg-[hsl(var(--surface-card))]">
              <Input
                value={newObjTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChangeTitle(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") onAddObjective(goal.id);
                  if (e.key === "Escape") onCancelAddForm();
                }}
                placeholder="Objective title…"
                className="h-8 text-[12px]"
                autoFocus
              />
              <Textarea
                value={newObjDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChangeDesc(e.target.value)
                }
                placeholder="Description (optional)…"
                className="resize-none h-14 text-[11px]"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={onCancelAddForm}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => onAddObjective(goal.id)}
                  disabled={!newObjTitle.trim()}
                >
                  Add objective
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAddForm}
              className="w-full border border-dashed border-[hsl(var(--hairline-strong))] rounded-lg py-2 flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--body))]/30 transition-all"
            >
              <Plus size={11} />
              Add objective
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Objective card ────────────────────────────────────────────────────────────

interface ObjectiveCardProps {
  obj: WeeklyObjective;
  color: { bar: string; cat: string; badge: string };
  onCycleStatus: (obj: WeeklyObjective) => void;
  onEdit: (obj: WeeklyObjective) => void;
  onDelete: (id: string) => void;
  onAddTask: (obj: WeeklyObjective) => void;
}

function ObjectiveCard({
  obj,
  color,
  onCycleStatus,
  onEdit,
  onDelete,
  onAddTask,
}: ObjectiveCardProps) {
  const tasks = getTasksForObjective(obj.id);
  const doneTasks = tasks.filter((t) => t.status === "completed").length;
  const taskPct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const borderClass =
    obj.status === "completed"
      ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
      : obj.status === "in-progress"
        ? "border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5"
        : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]";

  return (
    <div
      className={`group rounded-lg border p-3 transition-all ${borderClass}`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[12px] font-medium ${
                obj.status === "completed"
                  ? "line-through text-[hsl(var(--muted))]"
                  : "text-[hsl(var(--body-strong))]"
              }`}
            >
              {obj.title}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors(obj.status)}`}
            >
              {statusLabel(obj.status)}
            </span>
          </div>
          {obj.description && (
            <p className="text-[11px] text-[hsl(var(--muted))] mt-0.5 line-clamp-2">
              {obj.description}
            </p>
          )}
        </div>
        {/* Action buttons (always visible, compact) */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(obj)}
            title="Edit"
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--surface-strong))] transition-colors"
          >
            <Edit2 size={10} />
          </button>
          <button
            onClick={() => onDelete(obj.id)}
            title="Delete"
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Task progress bar */}
      {tasks.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--muted))] flex items-center gap-1">
              <ListTodo size={9} />
              {doneTasks}/{tasks.length} daily tasks
            </span>
            <span className="text-[10px] text-[hsl(var(--muted))]">
              {taskPct}%
            </span>
          </div>
          <div className="h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${taskPct}%`, background: color.bar }}
            />
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onCycleStatus(obj)}
          className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
            obj.status === "completed"
              ? "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
              : obj.status === "in-progress"
                ? "border-[hsl(var(--success))]/40 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
                : "border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10"
          }`}
        >
          {obj.status === "completed"
            ? "↩ Mark pending"
            : obj.status === "in-progress"
              ? "✓ Mark complete"
              : "▶ Start"}
        </button>
        <button
          onClick={() => onAddTask(obj)}
          className="text-[10px] px-2 py-1 rounded-md border border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--hairline-strong))] transition-all flex items-center gap-1"
        >
          <Plus size={9} />
          Add daily task
        </button>
      </div>
    </div>
  );
}

// ── Wizard Step 1: Goal selection ─────────────────────────────────────────────

interface WizardStep1Props {
  goals: Goal[];
  selectedGoalIds: string[];
  hourTargets: Record<string, number>;
  onToggleGoal: (id: string) => void;
  onChangeHours: (id: string, val: number) => void;
  onCancel: () => void;
  onContinue: () => void;
}

function WizardStep1({
  goals,
  selectedGoalIds,
  hourTargets,
  onToggleGoal,
  onChangeHours,
  onCancel,
  onContinue,
}: WizardStep1Props) {
  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Step 1 of 2
          </span>
          <div className="flex gap-1">
            <div className="w-8 h-1 rounded-full bg-[hsl(var(--primary))]" />
            <div className="w-8 h-1 rounded-full bg-[hsl(var(--surface-strong))]" />
          </div>
        </div>
        <DialogTitle className="text-[17px] font-semibold text-[hsl(var(--body-strong))]">
          Select goals to focus on
        </DialogTitle>
        <p className="text-[12px] text-[hsl(var(--muted))] mt-1 flex items-center gap-1">
          <CalendarDays size={11} />
          {weekLabel()}
        </p>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-2 overflow-y-auto flex-1">
        {activeGoals.length === 0 ? (
          <p className="text-[13px] text-[hsl(var(--muted))] text-center py-6">
            Add active goals first before planning your week.
          </p>
        ) : (
          activeGoals.map((goal) => {
            const color = GOAL_COLORS[goal.color] || GOAL_COLORS.Purple;
            const selected = selectedGoalIds.includes(goal.id);
            return (
              <div key={goal.id} className="space-y-1.5">
                <button
                  onClick={() => onToggleGoal(goal.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-[hsl(var(--hairline-strong))] bg-[hsl(var(--canvas-soft))]"
                      : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--canvas-soft))]/50"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 ${
                      selected
                        ? "bg-[hsl(var(--body-strong))] border-[hsl(var(--body-strong))]"
                        : "border-[hsl(var(--hairline))]"
                    }`}
                  >
                    {selected && (
                      <Check size={10} className="text-[hsl(var(--canvas))]" />
                    )}
                  </div>
                  {/* Tag */}
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${color.cat}`}
                  >
                    {goal.tag}
                  </span>
                  {/* Name */}
                  <span className="text-[13px] flex-1 text-[hsl(var(--body-strong))] truncate">
                    {goal.name}
                  </span>
                  {/* Priority */}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      goal.priority === "high"
                        ? "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))]"
                        : goal.priority === "medium"
                          ? "bg-[hsl(var(--timeline-thinking))]/40 text-[hsl(var(--body-strong))]"
                          : "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]"
                    }`}
                  >
                    {goal.priority}
                  </span>
                </button>

                {/* Hour target (only if selected) */}
                {selected && (
                  <div className="pl-3 flex items-center gap-2">
                    <Clock size={11} className="text-[hsl(var(--muted))]" />
                    <label className="text-[11px] text-[hsl(var(--muted))] whitespace-nowrap">
                      Hour target this week:
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={hourTargets[goal.id] || goal.weeklyTarget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onChangeHours(goal.id, Number(e.target.value))
                      }
                      className="h-7 w-16 text-[12px]"
                    />
                    <span className="text-[11px] text-[hsl(var(--muted))]">
                      h
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[hsl(var(--hairline))] flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-[hsl(var(--muted))]"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onContinue}
          disabled={selectedGoalIds.length === 0}
          className="gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          Continue to Objectives
          <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
}

// ── Wizard Step 2: Objectives per goal ───────────────────────────────────────

interface WizardStep2Props {
  goals: Goal[];
  objectives: WeeklyObjective[];
  focusedGoalId: string | null;
  weekKey: string;
  weekEnd: string;
  onFocusGoal: (id: string) => void;
  onBack: () => void;
  onDone: () => void;
  onAddObjective: (goalId: string, title: string, desc: string) => void;
  onCycleStatus: (obj: WeeklyObjective) => void;
  onEditObjective: (obj: WeeklyObjective) => void;
  onDeleteObjective: (id: string) => void;
  onAddTask: (obj: WeeklyObjective) => void;
}

function WizardStep2({
  goals,
  objectives,
  focusedGoalId,
  onFocusGoal,
  onBack,
  onDone,
  onAddObjective,
  onCycleStatus,
  onEditObjective,
  onDeleteObjective,
  onAddTask,
}: WizardStep2Props) {
  const [addingTitle, setAddingTitle] = useState("");
  const [addingDesc, setAddingDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const focusedGoal = goals.find((g) => g.id === focusedGoalId) ?? goals[0];
  const focusedObjs = objectives.filter((o) => o.goalId === focusedGoal?.id);

  function handleAdd() {
    if (!addingTitle.trim() || !focusedGoal) return;
    onAddObjective(focusedGoal.id, addingTitle.trim(), addingDesc.trim());
    setAddingTitle("");
    setAddingDesc("");
    setIsAdding(false);
  }

  if (!focusedGoal) return null;

  const color = GOAL_COLORS[focusedGoal.color] || GOAL_COLORS.Purple;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Step 2 of 2
          </span>
          <div className="flex gap-1">
            <div className="w-8 h-1 rounded-full bg-[hsl(var(--primary))]/40" />
            <div className="w-8 h-1 rounded-full bg-[hsl(var(--primary))]" />
          </div>
        </div>
        <DialogTitle className="text-[17px] font-semibold text-[hsl(var(--body-strong))]">
          Set weekly objectives
        </DialogTitle>
        <p className="text-[12px] text-[hsl(var(--muted))] mt-1">
          Define what you want to achieve for each goal this week.
        </p>

        {/* Goal tabs */}
        {goals.length > 1 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {goals.map((g) => {
              const c = GOAL_COLORS[g.color] || GOAL_COLORS.Purple;
              const active = g.id === focusedGoal.id;
              const count = objectives.filter((o) => o.goalId === g.id).length;
              return (
                <button
                  key={g.id}
                  onClick={() => onFocusGoal(g.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? `${c.cat} border-transparent`
                      : "border-[hsl(var(--hairline))] text-[hsl(var(--muted))] hover:border-[hsl(var(--hairline-strong))]"
                  }`}
                >
                  <span>{g.tag}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded-full ${active ? "bg-white/30" : "bg-[hsl(var(--surface-strong))]"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-2 overflow-y-auto max-h-[45vh]">
        {/* Current goal label */}
        <div className="flex items-center gap-2 mb-3">
          <Target size={13} className="text-[hsl(var(--muted))]" />
          <span className="text-[12px] font-medium text-[hsl(var(--body-strong))]">
            {focusedGoal.name}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color.cat}`}
          >
            {focusedGoal.tag}
          </span>
        </div>

        {/* Objective cards */}
        {focusedObjs.length === 0 && !isAdding && (
          <p className="text-[12px] text-[hsl(var(--muted))] text-center py-4">
            No objectives yet — add your first one below.
          </p>
        )}

        {focusedObjs.map((obj) => (
          <ObjectiveCard
            key={obj.id}
            obj={obj}
            color={color}
            onCycleStatus={onCycleStatus}
            onEdit={onEditObjective}
            onDelete={onDeleteObjective}
            onAddTask={onAddTask}
          />
        ))}

        {/* Add form */}
        {isAdding ? (
          <div className="border border-[hsl(var(--hairline-strong))] rounded-lg p-3 space-y-2 bg-[hsl(var(--surface-card))]">
            <Input
              value={addingTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAddingTitle(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
              placeholder="Objective title…"
              className="h-8 text-[12px]"
              autoFocus
            />
            <Textarea
              value={addingDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAddingDesc(e.target.value)
              }
              placeholder="Description — what does success look like? (optional)"
              className="resize-none h-16 text-[11px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={handleAdd}
                disabled={!addingTitle.trim()}
              >
                Add objective
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full border border-dashed border-[hsl(var(--hairline-strong))] rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-[11px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:border-[hsl(var(--body))]/30 transition-all"
          >
            <Plus size={12} />
            Add objective
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[hsl(var(--hairline))] flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-[hsl(var(--muted))]"
        >
          <ArrowLeft size={13} />
          Back
        </Button>
        <Button
          size="sm"
          onClick={onDone}
          className="transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          Save & close
        </Button>
      </div>
    </div>
  );
}
