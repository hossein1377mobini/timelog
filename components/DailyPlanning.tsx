"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon } from "lucide-react";
import {
  fetchGoals,
  fetchWeeklyObjectives,
  fetchTasksByObjective,
  createTask,
  updateTask as dbUpdateTask,
  fetchReflections,
  saveReflection,
  fetchTasks,
} from "@/lib/db-client";
import type { Goal, WeeklyObjective, Task, ChecklistItem, Reflection } from "@/lib/types";
import { todayKey, generateId, weekStartKey } from "@/lib/utils";
import { TaskItem } from "./daily-planning/TaskItem";
import { TaskEditDialog } from "./daily-planning/TaskEditDialog";
import { MorningPlanningTab } from "./daily-planning/MorningPlanningTab";
import { EveningReflectionTab } from "./daily-planning/EveningReflectionTab";

// ── Bootstrap helper ─────────────────────────────────────────────────────────

async function readInitialData() {
  const [goals, objectives, tasks, reflections] = await Promise.all([
    fetchGoals(),
    fetchWeeklyObjectives(weekStartKey()),
    fetchTasks(todayKey()),
    fetchReflections(),
  ]);
  const ref = reflections.find((r: Reflection) => r.date === todayKey()) ?? null;

  // Fetch tasks for each objective
  const objectiveTasks = new Map<string, Task[]>();
  await Promise.all(
    objectives.map(async (obj) => {
      const tasks = await fetchTasksByObjective(obj.id);
      objectiveTasks.set(obj.id, tasks);
    })
  );

  return { goals, objectives, tasks, ref, objectiveTasks };
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
  const [objectiveTasks, setObjectiveTasks] = useState<Map<string, Task[]>>(new Map());
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

  useEffect(() => {
    (async () => {
      try {
        const data = await readInitialData();
        setGoals(data.goals);
        setObjectives(data.objectives);
        setTodayTasks(data.tasks);
        setObjectiveTasks(data.objectiveTasks);
        if (data.tasks.length > 0) setEditing(false);
        if (data.ref) {
          setAccomplishments(data.ref.accomplishments.join("\n"));
          setDistractions(data.ref.challenges.join("\n"));
          setRating(data.ref.rating);
          setDifferently(data.ref.improvements.join("\n"));
          setGratitude(
            data.ref.wins.length >= 3
              ? [data.ref.wins[0] || "", data.ref.wins[1] || "", data.ref.wins[2] || ""]
              : ["", "", ""],
          );
          setTomorrowFocus(data.ref.tomorrowPlan);
          setEveningMood(data.ref.mood);
        }
      } catch (e) {
        console.error("Failed to load daily planning data:", e);
      }
    })();
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
      const allObjTasks = objectiveTasks.get(obj.id) ?? [];
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
  }, [objectives, goals, todayTasks, objectiveTasks]);

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

  async function addFreeTask() {
    const text = newFreeTask.trim();
    if (!text) return;
    const task = await createTask({
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
  }

  async function selectTaskFromObjective(task: Task) {
    await dbUpdateTask(task.id, { scheduledDate: todayKey() });
    const updated: Task = { ...task, scheduledDate: todayKey() };
    setTodayTasks((prev) => [...prev, updated]);
  }

  async function removeTask(taskId: string) {
    await dbUpdateTask(taskId, { scheduledDate: "" });
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function saveMorningPlan() {
    setEditing(false);
  }

  /** Cycle: pending → in-progress → completed → pending */
  async function cycleStatus(task: Task) {
    const next: Task["status"] =
      task.status === "pending"
        ? "in-progress"
        : task.status === "in-progress"
          ? "completed"
          : "pending";
    await dbUpdateTask(task.id, { status: next });
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
  }

  async function toggleChecklistItem(task: Task, itemId: string) {
    const newChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    await dbUpdateTask(task.id, { checklist: newChecklist });
    setTodayTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, checklist: newChecklist } : t,
      ),
    );
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

  async function saveEdit() {
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
    await dbUpdateTask(editState.taskId, patch);
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === editState.taskId ? { ...t, ...patch } : t)),
    );
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

  async function saveEveningReflection() {
    await saveReflection({
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
  }

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
            <MorningPlanningTab
              editing={editing}
              todayTasks={todayTasks}
              objectiveGroups={objectiveGroups}
              newFreeTask={newFreeTask}
              mood={mood}
              energy={energy}
              completedCount={completedCount}
              totalEstimated={totalEstimated}
              progressPct={progressPct}
              onSetNewFreeTask={setNewFreeTask}
              onSetMood={setMood}
              onSetEnergy={setEnergy}
              onAddFreeTask={addFreeTask}
              onSelectTaskFromObjective={selectTaskFromObjective}
              onRemoveTask={removeTask}
              onSaveMorningPlan={saveMorningPlan}
              onSetEditing={setEditing}
            >
              {todayTasks.map((task) => {
                const goalInfo =
                  task.objectiveId && objectiveGoalMap.has(task.objectiveId)
                    ? objectiveGoalMap.get(task.objectiveId)!
                    : null;
                const checklistOpen = openChecklists.has(task.id);

                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    goalInfo={goalInfo}
                    checklistOpen={checklistOpen}
                    onCycleStatus={cycleStatus}
                    onToggleChecklist={toggleChecklist}
                    onToggleChecklistItem={toggleChecklistItem}
                    onEdit={openEdit}
                    onRemove={removeTask}
                  />
                );
              })}
            </MorningPlanningTab>
          )}

          {/* ═══════════════════ EVENING TAB ═══════════════════ */}
          {tab === "evening" && (
            <EveningReflectionTab
              accomplishments={accomplishments}
              distractions={distractions}
              rating={rating}
              differently={differently}
              gratitude={gratitude}
              tomorrowFocus={tomorrowFocus}
              eveningMood={eveningMood}
              newAccomplishment={newAccomplishment}
              newDistraction={newDistraction}
              newDifferently={newDifferently}
              onSetAccomplishments={setAccomplishments}
              onSetDistractions={setDistractions}
              onSetRating={setRating}
              onSetDifferently={setDifferently}
              onSetGratitude={setGratitude}
              onSetTomorrowFocus={setTomorrowFocus}
              onSetEveningMood={setEveningMood}
              onSetNewAccomplishment={setNewAccomplishment}
              onSetNewDistraction={setNewDistraction}
              onSetNewDifferently={setNewDifferently}
              onSaveEveningReflection={saveEveningReflection}
            />
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════ EDIT TASK DIALOG ═══════════════════ */}
      <TaskEditDialog
        editState={editState}
        onClose={() => setEditState(null)}
        onSave={saveEdit}
        onUpdateEditState={setEditState}
        onAddChecklistItem={addChecklistItem}
        onRemoveChecklistItem={removeChecklistItem}
        onToggleChecklistItem={toggleEditChecklistItem}
      />
    </>
  );
}
