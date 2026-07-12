"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Save, Plus } from "lucide-react";
import {
  createTask,
  saveReflection,
  fetchWeeklyObjectives,
  fetchGoals,
} from "@/lib/db-client";
import type { Task, WeeklyObjective, Goal } from "@/lib/types";
import { weekStartKey } from "@/lib/utils";

import MoodSelector from "./MoodSelector";
import ReflectionNotes from "./ReflectionNotes";
import TomorrowPlan from "./TomorrowPlan";
import UnfinishedTasks from "./UnfinishedTasks";
import AddTaskSheet from "./AddTaskSheet";

interface NightReflectionProps {
  unfinishedTasks: Task[];
  today: string;
  tomorrow: string;
  onDone: () => void;
  onClose: () => void;
}

export default function NightReflection({
  unfinishedTasks,
  today,
  tomorrow,
  onDone,
  onClose,
}: NightReflectionProps) {
  const [carryTaskIds, setCarryTaskIds] = useState<Set<string>>(
    new Set(unfinishedTasks.map((t) => t.id))
  );
  const [newTasks, setNewTasks] = useState<
    Array<{ title: string; objectiveId: string | null }>
  >([]);
  const weekStart = weekStartKey();
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedObjIds, setSelectedObjIds] = useState<Set<string>>(new Set());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchWeeklyObjectives(weekStart),
      fetchGoals(),
    ]).then(([objs, gs]) => {
      setObjectives(objs);
      setGoals(gs.filter((g) => g.status === "active"));
    }).catch(console.error);
  }, [weekStart]);

  const objectiveGoalMap = useMemo(() => {
    const map = new Map<string, { objective: WeeklyObjective; goal: Goal }>();
    for (const obj of objectives) {
      const goal = goals.find((g) => g.id === obj.goalId);
      if (goal) map.set(obj.id, { objective: obj, goal });
    }
    return map;
  }, [objectives, goals]);

  function handleToggleCarry(taskId: string) {
    setCarryTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function handleToggleObjective(objId: string) {
    setSelectedObjIds((prev) => {
      const next = new Set(prev);
      if (next.has(objId)) next.delete(objId);
      else next.add(objId);
      return next;
    });
  }

  function handleAddNewTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    if (selectedObjIds.size === 0) {
      setNewTasks((prev) => [...prev, { title, objectiveId: null }]);
    } else {
      for (const objId of selectedObjIds) {
        setNewTasks((prev) => [...prev, { title, objectiveId: objId }]);
      }
    }
    setNewTaskTitle("");
    setSelectedObjIds(new Set());
  }

  function handleRemoveNewTask(index: number) {
    setNewTasks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const carriedTasks = unfinishedTasks.filter((t) =>
        carryTaskIds.has(t.id)
      );
      for (const task of carriedTasks) {
        await createTask({
          objectiveId: task.objectiveId,
          title: task.title,
          description: task.description,
          estimatedTime: task.estimatedTime,
          priority: task.priority,
          status: "pending",
          scheduledDate: tomorrow,
          scheduledTime: task.scheduledTime,
          tags: task.tags,
          checklist: task.checklist,
          sessionId: null,
          pomodoroCount: 0,
        });
      }
      for (const nt of newTasks) {
        await createTask({
          objectiveId: nt.objectiveId,
          title: nt.title,
          description: "",
          estimatedTime: 0,
          priority: "medium",
          status: "pending",
          scheduledDate: tomorrow,
          scheduledTime: "",
          tags: [],
          checklist: [],
          sessionId: null,
          pomodoroCount: 0,
        });
      }
      await saveReflection({
        date: today,
        mood: rating,
        accomplishments: [],
        challenges: [],
        improvements: [],
        rating,
        wins: [],
        tomorrowPlan: reflectionText,
        notes: reflectionText,
      });
      onDone();
    } catch (e) {
      console.error("Failed to save night reflection:", e);
    } finally {
      setSaving(false);
    }
  }

  const tomorrowTasks = useMemo(() => {
    const carried = unfinishedTasks
      .filter((t) => carryTaskIds.has(t.id))
      .map((t) => ({ title: t.title, carried: true as const }));
    const added = newTasks.map((t) => ({
      title: t.title,
      carried: false as const,
    }));
    return [...carried, ...added];
  }, [unfinishedTasks, carryTaskIds, newTasks]);

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">
          Night Reflection
        </h2>
        <p className="text-[12px] text-[hsl(var(--muted))] mt-0.5">
          Close out your day — plan tomorrow and reflect
        </p>
      </div>

      <UnfinishedTasks
        unfinishedTasks={unfinishedTasks}
        carryTaskIds={carryTaskIds}
        onToggle={handleToggleCarry}
      />

      <Button
        onClick={() => setShowBottomSheet(true)}
        variant="outline"
        className="w-full h-10 text-[13px] border-dashed"
      >
        <Plus size={14} className="mr-1.5" />
        Add Task for Tomorrow
      </Button>

      {tomorrowTasks.length > 0 && (
        <TomorrowPlan
          tomorrowTasks={tomorrowTasks}
          removeNewTask={handleRemoveNewTask}
        />
      )}

      <ReflectionNotes
        reflectionText={reflectionText}
        onReflectionTextChange={setReflectionText}
      />

      <MoodSelector rating={rating} onRatingChange={setRating} />

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1 h-11">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 text-[14px] font-medium"
        >
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save & Close Day"}
        </Button>
      </div>

      <AddTaskSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        objectives={objectives}
        objectiveGoalMap={objectiveGoalMap}
        selectedObjIds={selectedObjIds}
        onToggleObjective={handleToggleObjective}
        newTaskTitle={newTaskTitle}
        onNewTaskTitleChange={setNewTaskTitle}
        onAddNewTask={handleAddNewTask}
      />
    </div>
  );
}
