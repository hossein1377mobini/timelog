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
  Sun,
  Moon,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Clock,
  Flag,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import {
  getGoals,
  getObjectivesForWeek,
  getTasksForObjective,
  saveTask,
  updateTask,
  getReflectionByDate,
  saveReflection,
  getTasksForDate,
  dispatchStorageEvent,
} from "@/lib/storage";
import type { Goal, WeeklyObjective, Task, ChecklistItem } from "@/lib/types";
import { todayKey, generateId } from "@/lib/utils";
import { MOODS, GOAL_COLOR_MAP } from "@/lib/constants";

// ── Bootstrap helper ─────────────────────────────────────────────────────────

function readInitialData() {
  const goals = getGoals();
  const objectives = getObjectivesForWeek();
  const tasks = getTasksForDate(todayKey());
  const ref = getReflectionByDate(todayKey());
  return { goals, objectives, tasks, ref };
}

// ── Edit-task dialog state type ───────────────────────────────────────────────

interface EditState {
  taskId: string;
  title: string;
  description: string;
  estimatedTime: number;
  scheduledTime: string;
  priority: "high" | "medium" | "low";
  tags: string;
  checklist: ChecklistItem[];
  newChecklistText: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DailyPlanning() {
  // Tab
  const [tab, setTab] = useState<"morning" | "evening">("morning");

  // Core data
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<boolean>(true);

  // Morning planning
  const [newFreeTask, setNewFreeTask] = useState("");
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);

  // Collapsible checklists: set of task IDs whose checklist is open
  const [openChecklists, setOpenChecklists] = useState<Set<string>>(new Set());

  // Edit dialog
  const [editState, setEditState] = useState<EditState | null>(null);

  // Evening reflection
  const [accomplishments, setAccomplishments] = useState("");
  const [distractions, setDistractions] = useState("");
  const [rating, setRating] = useState(0);
  const [differently, setDifferently] = useState("");
  const [gratitude, setGratitude] = useState<[string, string, string]>([
    "",
    "",
    "",
  ]);
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  const [eveningMood, setEveningMood] = useState(0);

  // Evening tab — add-item input buffers
  const [newAccomplishment, setNewAccomplishment] = useState("");
  const [newDistraction, setNewDistraction] = useState("");
  const [newDifferently, setNewDifferently] = useState("");

  // ── Storage sync ────────────────────────────────────────────────────────────

  function applyData(data: ReturnType<typeof readInitialData>) {
    setGoals(data.goals);
    setObjectives(data.objectives);
    setTodayTasks(data.tasks);
    if (data.tasks.length > 0) setEditing(false);
    if (data.ref) {
      setAccomplishments(data.ref.accomplishments.join("\n"));
      setDistractions(data.ref.challenges.join("\n"));
      setRating(data.ref.rating);
      setDifferently(data.ref.improvements.join("\n"));
      setGratitude(
        data.ref.wins.length >= 3
          ? [data.ref.wins[0], data.ref.wins[1], data.ref.wins[2]]
          : ["", "", ""],
      );
      setTomorrowFocus(data.ref.tomorrowPlan);
      setEveningMood(data.ref.mood);
    }
  }

  useEffect(() => {
    function onStorage() {
      applyData(readInitialData());
    }
    window.addEventListener("storage", onStorage);
    onStorage(); // initial load after mount
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  /** Map from objectiveId → { objective, goal } */
  const objectiveGoalMap = useMemo(() => {
    const map = new Map<string, { objective: WeeklyObjective; goal: Goal }>();
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId);
      if (goal) map.set(obj.id, { objective: obj, goal });
    }
    return map;
  }, [objectives, goals]);

  /**
   * Tasks grouped by objective that are NOT already scheduled for today,
   * but also include today-scheduled tasks shown as checked/disabled.
   */
  const objectiveGroups = useMemo(() => {
    const todayIds = new Set(todayTasks.map((t) => t.id));
    const result: {
      objective: WeeklyObjective;
      goal: Goal;
      tasks: Task[];
      todayTaskIds: Set<string>;
    }[] = [];
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId);
      if (!goal) continue;
      const allObjTasks = getTasksForObjective(obj.id);
      if (allObjTasks.length === 0) continue;
      result.push({
        objective: obj,
        goal,
        tasks: allObjTasks,
        todayTaskIds: new Set(
          allObjTasks.filter((t) => todayIds.has(t.id)).map((t) => t.id),
        ),
      });
    }
    return result;
  }, [objectives, goals, todayTasks]);

  const completedCount = todayTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalEstimated = todayTasks.reduce(
    (sum, t) => sum + (t.estimatedTime ?? 0),
    0,
  );
  const progressPct =
    todayTasks.length === 0
      ? 0
      : Math.round((completedCount / todayTasks.length) * 100);

  // ── Morning actions ─────────────────────────────────────────────────────────

  function addFreeTask() {
    const text = newFreeTask.trim();
    if (!text) return;
    const task = saveTask({
      objectiveId: null,
      title: text,
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
    setTodayTasks((prev) => [...prev, task]);
    setNewFreeTask("");
    dispatchStorageEvent();
  }

  function selectTaskFromObjective(task: Task) {
    updateTask(task.id, { scheduledDate: todayKey() });
    const updated: Task = { ...task, scheduledDate: todayKey() };
    setTodayTasks((prev) => [...prev, updated]);
    dispatchStorageEvent();
  }

  function removeTask(taskId: string) {
    updateTask(taskId, { scheduledDate: "" });
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
    dispatchStorageEvent();
  }

  function saveMorningPlan() {
    setEditing(false);
    dispatchStorageEvent();
  }

  /** Cycle: pending → in-progress → completed → pending */
  function cycleStatus(task: Task) {
    const next: Task["status"] =
      task.status === "pending"
        ? "in-progress"
        : task.status === "in-progress"
          ? "completed"
          : "pending";
    updateTask(task.id, { status: next });
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    dispatchStorageEvent();
  }

  function toggleChecklistItem(task: Task, itemId: string) {
    const newChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    updateTask(task.id, { checklist: newChecklist });
    setTodayTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, checklist: newChecklist } : t,
      ),
    );
    dispatchStorageEvent();
  }

  function toggleChecklist(taskId: string) {
    setOpenChecklists((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  // ── Edit dialog actions ─────────────────────────────────────────────────────

  function openEdit(task: Task) {
    setEditState({
      taskId: task.id,
      title: task.title,
      description: task.description,
      estimatedTime: task.estimatedTime,
      scheduledTime: task.scheduledTime,
      priority: task.priority,
      tags: task.tags.join(", "),
      checklist: task.checklist.map((c) => ({ ...c })),
      newChecklistText: "",
    });
  }

  function saveEdit() {
    if (!editState) return;
    const patch: Partial<Task> = {
      title: editState.title.trim() || "(untitled)",
      description: editState.description,
      estimatedTime: editState.estimatedTime,
      scheduledTime: editState.scheduledTime,
      priority: editState.priority,
      tags: editState.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      checklist: editState.checklist,
    };
    updateTask(editState.taskId, patch);
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === editState.taskId ? { ...t, ...patch } : t)),
    );
    dispatchStorageEvent();
    setEditState(null);
  }

  function addChecklistItem() {
    if (!editState) return;
    const text = editState.newChecklistText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: generateId(), text, done: false };
    setEditState((prev) =>
      prev
        ? {
            ...prev,
            checklist: [...prev.checklist, item],
            newChecklistText: "",
          }
        : null,
    );
  }

  function removeChecklistItem(itemId: string) {
    setEditState((prev) =>
      prev
        ? { ...prev, checklist: prev.checklist.filter((c) => c.id !== itemId) }
        : null,
    );
  }

  function toggleEditChecklistItem(itemId: string) {
    setEditState((prev) =>
      prev
        ? {
            ...prev,
            checklist: prev.checklist.map((c) =>
              c.id === itemId ? { ...c, done: !c.done } : c,
            ),
          }
        : null,
    );
  }

  // ── Evening actions ─────────────────────────────────────────────────────────

  function saveEveningReflection() {
    saveReflection({
      date: todayKey(),
      mood: eveningMood,
      accomplishments: accomplishments.split("\n").filter(Boolean),
      challenges: distractions.split("\n").filter(Boolean),
      improvements: differently.split("\n").filter(Boolean),
      rating,
      wins: gratitude.filter(Boolean),
      tomorrowPlan: tomorrowFocus,
      notes: "",
    });
    dispatchStorageEvent();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function priorityBadge(priority: Task["priority"]) {
    if (priority === "high")
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[hsl(var(--error))]">
          <Flag size={8} />
          High
        </span>
      );
    if (priority === "medium")
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[hsl(var(--warning))]">
          <Flag size={8} />
          Med
        </span>
      );
    return <span className="text-[9px] text-[hsl(var(--muted))]">· Low</span>;
  }

  function statusButton(task: Task) {
    if (task.status === "pending")
      return (
        <button
          onClick={() => cycleStatus(task)}
          title="Start task"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center border border-[hsl(var(--hairline))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] text-[hsl(var(--muted))] transition-all"
        >
          <Play size={9} />
        </button>
      );
    if (task.status === "in-progress")
      return (
        <button
          onClick={() => cycleStatus(task)}
          title="Mark done"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] transition-all"
        >
          <Check size={9} />
        </button>
      );
    // completed
    return (
      <button
        onClick={() => cycleStatus(task)}
        title="Reopen"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-[hsl(var(--success))] border-transparent text-white hover:opacity-80 transition-all"
      >
        <Check size={9} />
      </button>
    );
  }

  // ── Today date label ────────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Sun size={14} className="text-[hsl(var(--muted))]" />
              Daily Planning
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setTab("morning")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  tab === "morning"
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                }`}
              >
                <Sun size={11} className="inline mr-1" />
                Morning
              </button>
              <button
                onClick={() => setTab("evening")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  tab === "evening"
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                }`}
              >
                <Moon size={11} className="inline mr-1" />
                Evening
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ═══════════════════ MORNING TAB ═══════════════════ */}
          {tab === "morning" && (
            <div className="space-y-4">
              {/* ── Date + badge ── */}
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[hsl(var(--body-strong))]">
                  {todayLabel}
                </span>
                {todayTasks.length > 0 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    {todayTasks.length - completedCount} task
                    {todayTasks.length - completedCount !== 1 ? "s" : ""}{" "}
                    remaining
                  </span>
                )}
              </div>

              {/* ═══ EDITING MODE ═══ */}
              {editing && (
                <div className="space-y-4">
                  {/* Objective task selector */}
                  {objectiveGroups.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                        Select from weekly objectives
                      </p>
                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {objectiveGroups.map(
                          ({ objective, goal, tasks, todayTaskIds }) => (
                            <div key={objective.id} className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    GOAL_COLOR_MAP[goal.color] ??
                                    GOAL_COLOR_MAP.Purple
                                  }`}
                                >
                                  {goal.tag}
                                </span>
                                <p className="text-[11px] font-medium text-[hsl(var(--body-strong))] truncate">
                                  {objective.title}
                                </p>
                              </div>
                              {tasks.map((task) => {
                                const isAdded = todayTaskIds.has(task.id);
                                return (
                                  <button
                                    key={task.id}
                                    onClick={() =>
                                      !isAdded && selectTaskFromObjective(task)
                                    }
                                    disabled={isAdded}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border transition-all text-left ${
                                      isAdded
                                        ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 cursor-default"
                                        : "border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--canvas-soft))]"
                                    }`}
                                  >
                                    <span
                                      className={`shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center ${
                                        isAdded
                                          ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]"
                                          : "border-[hsl(var(--hairline))]"
                                      }`}
                                    >
                                      {isAdded && (
                                        <Check
                                          size={9}
                                          className="text-white"
                                        />
                                      )}
                                    </span>
                                    <span
                                      className={`text-[12px] truncate ${
                                        isAdded
                                          ? "text-[hsl(var(--muted))] line-through"
                                          : "text-[hsl(var(--body-strong))]"
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                    {task.estimatedTime > 0 && (
                                      <span className="ml-auto shrink-0 text-[10px] text-[hsl(var(--muted))]">
                                        {task.estimatedTime}m
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ),
                        )}
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted))] pt-0.5">
                        🎯 Focus: pick 2–5 tasks for the day
                      </p>
                    </div>
                  )}

                  {/* Free task input */}
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                      Add a free task
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={newFreeTask}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewFreeTask(e.target.value)
                        }
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                          e.key === "Enter" && addFreeTask()
                        }
                        placeholder="Task title..."
                        className="h-8 text-[12px]"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 shrink-0"
                        onClick={addFreeTask}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Queued tasks preview */}
                  {todayTasks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] text-[hsl(var(--muted))]">
                        Queued for today ({todayTasks.length})
                      </p>
                      {todayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                        >
                          <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))] truncate">
                            {task.title}
                          </span>
                          <button
                            onClick={() => removeTask(task.id)}
                            className="shrink-0 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mood + Energy */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] text-[hsl(var(--muted))]">
                      Mood
                    </span>
                    <div className="flex gap-1">
                      {MOODS.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setMood(i)}
                          className={`text-[16px] transition-all ${
                            mood === i
                              ? "scale-125"
                              : "opacity-40 hover:opacity-70"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted))] ml-2">
                      Energy
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setEnergy(n)}
                          className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center transition-all ${
                            energy >= n
                              ? "bg-[hsl(var(--primary))] text-white"
                              : "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save button */}
                  <Button
                    className="w-full"
                    onClick={saveMorningPlan}
                    disabled={todayTasks.length === 0}
                  >
                    Save morning plan
                  </Button>
                </div>
              )}

              {/* ═══ DASHBOARD MODE ═══ */}
              {!editing && (
                <div className="space-y-4">
                  {/* Progress header */}
                  {todayTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[hsl(var(--muted))]">
                        <span>
                          {completedCount}/{todayTasks.length} tasks
                          {totalEstimated > 0 && (
                            <>
                              {" "}
                              · <Clock
                                size={9}
                                className="inline mb-0.5"
                              />{" "}
                              {totalEstimated}m estimated
                            </>
                          )}
                        </span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[hsl(var(--surface-strong))] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--success))] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Task list */}
                  {todayTasks.length === 0 ? (
                    <p className="text-[12px] text-[hsl(var(--muted))] text-center py-4">
                      No tasks planned for today.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {todayTasks.map((task) => {
                        const goalInfo =
                          task.objectiveId &&
                          objectiveGoalMap.has(task.objectiveId)
                            ? objectiveGoalMap.get(task.objectiveId)!
                            : null;
                        const checklistOpen = openChecklists.has(task.id);
                        const doneItems = task.checklist.filter(
                          (c) => c.done,
                        ).length;

                        return (
                          <div
                            key={task.id}
                            className={`rounded-lg border transition-all ${
                              task.status === "completed"
                                ? "border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5"
                                : task.status === "in-progress"
                                  ? "border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5"
                                  : "border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                            }`}
                          >
                            {/* Task row */}
                            <div className="flex items-start gap-2 px-2.5 py-2">
                              {/* Status button */}
                              <div className="mt-0.5">{statusButton(task)}</div>

                              {/* Main content */}
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[12px] font-medium leading-tight ${
                                      task.status === "completed"
                                        ? "line-through text-[hsl(var(--muted))]"
                                        : "text-[hsl(var(--body-strong))]"
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  {goalInfo && (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                        GOAL_COLOR_MAP[goalInfo.goal.color] ??
                                        GOAL_COLOR_MAP.Purple
                                      }`}
                                    >
                                      {goalInfo.goal.tag}
                                    </span>
                                  )}
                                </div>

                                {/* Badges row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {priorityBadge(task.priority)}
                                  {task.estimatedTime > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] text-[hsl(var(--muted))]">
                                      <Clock size={8} />
                                      {task.estimatedTime}m
                                    </span>
                                  )}
                                  {task.scheduledTime && (
                                    <span className="text-[9px] text-[hsl(var(--muted))]">
                                      @ {task.scheduledTime}
                                    </span>
                                  )}
                                  {task.checklist.length > 0 && (
                                    <button
                                      onClick={() => toggleChecklist(task.id)}
                                      className="inline-flex items-center gap-0.5 text-[9px] text-[hsl(var(--muted))] hover:text-[hsl(var(--body))] transition-colors"
                                    >
                                      {checklistOpen ? (
                                        <ChevronUp size={8} />
                                      ) : (
                                        <ChevronDown size={8} />
                                      )}
                                      {doneItems}/{task.checklist.length}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                <button
                                  onClick={() => openEdit(task)}
                                  className="text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
                                  title="Edit task"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => removeTask(task.id)}
                                  className="text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors"
                                  title="Remove from today"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            {/* Checklist (collapsible) */}
                            {checklistOpen && task.checklist.length > 0 && (
                              <div className="px-4 pb-2 space-y-1 border-t border-[hsl(var(--hairline))] pt-2">
                                {task.checklist.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() =>
                                      toggleChecklistItem(task, item.id)
                                    }
                                    className="flex items-center gap-2 w-full text-left group/cl"
                                  >
                                    <span
                                      className={`shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                                        item.done
                                          ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                                          : "border-[hsl(var(--hairline))] group-hover/cl:border-[hsl(var(--hairline-strong))]"
                                      }`}
                                    >
                                      {item.done && (
                                        <Check
                                          size={8}
                                          className="text-white"
                                        />
                                      )}
                                    </span>
                                    <span
                                      className={`text-[11px] ${
                                        item.done
                                          ? "line-through text-[hsl(var(--muted))]"
                                          : "text-[hsl(var(--body))]"
                                      }`}
                                    >
                                      {item.text}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Edit plan button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditing(true)}
                  >
                    Edit plan
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════ EVENING TAB ═══════════════════ */}
          {tab === "evening" && (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <p className="text-[13px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  🌙 Evening Reflection
                </p>
                <p className="text-[11px] text-[hsl(var(--muted))] mt-0.5">
                  {todayLabel}
                </p>
              </div>

              {/* 1. Mood */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    1
                  </span>
                  How did today go?
                </label>
                <div className="flex gap-2">
                  {MOODS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setEveningMood(i)}
                      className={`text-[20px] transition-all ${
                        eveningMood === i
                          ? "scale-125"
                          : "opacity-40 hover:opacity-70"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Star rating */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    2
                  </span>
                  Rate your day
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`text-[18px] transition-all ${
                        rating >= n
                          ? "text-[hsl(var(--warning))]"
                          : "text-[hsl(var(--hairline-strong))]"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Accomplishments bullet list */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                  What did you accomplish today?
                </label>
                <div className="space-y-1">
                  {accomplishments
                    .split("\n")
                    .filter(Boolean)
                    .map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 group/acc"
                      >
                        <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                          •
                        </span>
                        <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                          {line}
                        </span>
                        <button
                          onClick={() => {
                            const lines = accomplishments
                              .split("\n")
                              .filter(Boolean);
                            lines.splice(idx, 1);
                            setAccomplishments(lines.join("\n"));
                          }}
                          className="opacity-0 group-hover/acc:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newAccomplishment}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewAccomplishment(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const text = newAccomplishment.trim();
                        if (!text) return;
                        setAccomplishments((prev) =>
                          prev ? prev + "\n" + text : text,
                        );
                        setNewAccomplishment("");
                      }
                    }}
                    placeholder="Add accomplishment..."
                    className="h-7 text-[12px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 shrink-0"
                    onClick={() => {
                      const text = newAccomplishment.trim();
                      if (!text) return;
                      setAccomplishments((prev) =>
                        prev ? prev + "\n" + text : text,
                      );
                      setNewAccomplishment("");
                    }}
                  >
                    <Plus size={11} />
                  </Button>
                </div>
              </div>

              {/* 4. Distractions / challenges bullet list */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    4
                  </span>
                  What challenged you?
                </label>
                <div className="space-y-1">
                  {distractions
                    .split("\n")
                    .filter(Boolean)
                    .map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 group/dis"
                      >
                        <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                          •
                        </span>
                        <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                          {line}
                        </span>
                        <button
                          onClick={() => {
                            const lines = distractions
                              .split("\n")
                              .filter(Boolean);
                            lines.splice(idx, 1);
                            setDistractions(lines.join("\n"));
                          }}
                          className="opacity-0 group-hover/dis:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newDistraction}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewDistraction(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const text = newDistraction.trim();
                        if (!text) return;
                        setDistractions((prev) =>
                          prev ? prev + "\n" + text : text,
                        );
                        setNewDistraction("");
                      }
                    }}
                    placeholder="Add challenge..."
                    className="h-7 text-[12px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 shrink-0"
                    onClick={() => {
                      const text = newDistraction.trim();
                      if (!text) return;
                      setDistractions((prev) =>
                        prev ? prev + "\n" + text : text,
                      );
                      setNewDistraction("");
                    }}
                  >
                    <Plus size={11} />
                  </Button>
                </div>
              </div>

              {/* 5. What would you do differently — bullet list */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    5
                  </span>
                  What would you do differently?
                </label>
                <div className="space-y-1">
                  {differently
                    .split("\n")
                    .filter(Boolean)
                    .map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 group/dif"
                      >
                        <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                          •
                        </span>
                        <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                          {line}
                        </span>
                        <button
                          onClick={() => {
                            const lines = differently
                              .split("\n")
                              .filter(Boolean);
                            lines.splice(idx, 1);
                            setDifferently(lines.join("\n"));
                          }}
                          className="opacity-0 group-hover/dif:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newDifferently}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewDifferently(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const text = newDifferently.trim();
                        if (!text) return;
                        setDifferently((prev) =>
                          prev ? prev + "\n" + text : text,
                        );
                        setNewDifferently("");
                      }
                    }}
                    placeholder="Add lesson learned..."
                    className="h-7 text-[12px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 shrink-0"
                    onClick={() => {
                      const text = newDifferently.trim();
                      if (!text) return;
                      setDifferently((prev) =>
                        prev ? prev + "\n" + text : text,
                      );
                      setNewDifferently("");
                    }}
                  >
                    <Plus size={11} />
                  </Button>
                </div>
              </div>

              {/* 6. Wins / gratitude */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    6
                  </span>
                  Any wins to celebrate? 🎉
                </label>
                <div className="space-y-1.5">
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[14px] shrink-0">🏆</span>
                      <Input
                        value={gratitude[i]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const next = [...gratitude] as [
                            string,
                            string,
                            string,
                          ];
                          next[i] = e.target.value;
                          setGratitude(next);
                        }}
                        placeholder={`Win ${i + 1}...`}
                        className="h-7 text-[12px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Tomorrow's focus */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
                    7
                  </span>
                  Plan for tomorrow?
                </label>
                <Input
                  value={tomorrowFocus}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTomorrowFocus(e.target.value)
                  }
                  placeholder="What will you focus on tomorrow?"
                  className="h-8 text-[12px]"
                />
              </div>

              <Button className="w-full" onClick={saveEveningReflection}>
                Save evening reflection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════ EDIT TASK DIALOG ═══════════════════ */}
      <Dialog
        open={editState !== null}
        onOpenChange={(open) => !open && setEditState(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Edit Task</DialogTitle>
          </DialogHeader>

          {editState && (
            <div className="space-y-3 py-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Title
                </label>
                <Input
                  value={editState.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditState((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  className="h-8 text-[13px]"
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Description
                </label>
                <Textarea
                  value={editState.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditState((prev) =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                  className="resize-none h-14 text-[12px]"
                  placeholder="Optional details..."
                />
              </div>

              {/* Estimated time + Scheduled time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                    Estimated (min)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={
                      editState.estimatedTime === 0
                        ? ""
                        : editState.estimatedTime
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditState((prev) =>
                        prev
                          ? {
                              ...prev,
                              estimatedTime: parseInt(e.target.value) || 0,
                            }
                          : null,
                      )
                    }
                    className="h-8 text-[12px]"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                    Scheduled time
                  </label>
                  <Input
                    type="time"
                    value={editState.scheduledTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditState((prev) =>
                        prev
                          ? { ...prev, scheduledTime: e.target.value }
                          : null,
                      )
                    }
                    className="h-8 text-[12px]"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Priority
                </label>
                <select
                  value={editState.priority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditState((prev) =>
                      prev
                        ? {
                            ...prev,
                            priority: e.target.value as
                              "high" | "medium" | "low",
                          }
                        : null,
                    )
                  }
                  className="w-full h-8 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] px-2 text-[12px] text-[hsl(var(--body-strong))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="high">🔥 High</option>
                  <option value="medium">⭐ Medium</option>
                  <option value="low">· Low</option>
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Tags (comma-separated)
                </label>
                <Input
                  value={editState.tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditState((prev) =>
                      prev ? { ...prev, tags: e.target.value } : null,
                    )
                  }
                  className="h-8 text-[12px]"
                  placeholder="focus, deep-work, admin..."
                />
              </div>

              {/* Checklist */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Checklist
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {editState.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group/item"
                    >
                      <button
                        onClick={() => toggleEditChecklistItem(item.id)}
                        className={`shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                          item.done
                            ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                            : "border-[hsl(var(--hairline))]"
                        }`}
                      >
                        {item.done && <Check size={8} className="text-white" />}
                      </button>
                      <span
                        className={`flex-1 text-[12px] ${
                          item.done
                            ? "line-through text-[hsl(var(--muted))]"
                            : "text-[hsl(var(--body))]"
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="opacity-0 group-hover/item:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editState.newChecklistText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditState((prev) =>
                        prev
                          ? { ...prev, newChecklistText: e.target.value }
                          : null,
                      )
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                      e.key === "Enter" && addChecklistItem()
                    }
                    placeholder="Add checklist item..."
                    className="h-7 text-[11px]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 shrink-0"
                    onClick={addChecklistItem}
                  >
                    <Plus size={11} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditState(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
