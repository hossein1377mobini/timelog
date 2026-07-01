"use client";

import React from "react";
import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task, Goal, WeeklyObjective } from "@/lib/types";
import { MOODS } from "@/lib/constants";
import { ObjectiveTaskSelector } from "./ObjectiveTaskSelector";
import { formatTodayLabel } from "./dailyPlanningHelpers";

interface ObjectiveGroup {
  objective: WeeklyObjective;
  goal: Goal;
  tasks: Task[];
  todayTaskIds: Set<string>;
}

interface MorningPlanningTabProps {
  editing: boolean;
  todayTasks: Task[];
  objectiveGroups: ObjectiveGroup[];
  newFreeTask: string;
  mood: number;
  energy: number;
  completedCount: number;
  totalEstimated: number;
  progressPct: number;
  onSetNewFreeTask: (value: string) => void;
  onSetMood: (value: number) => void;
  onSetEnergy: (value: number) => void;
  onAddFreeTask: () => void;
  onSelectTaskFromObjective: (task: Task) => void;
  onRemoveTask: (taskId: string) => void;
  onSaveMorningPlan: () => void;
  onSetEditing: (editing: boolean) => void;
  children: React.ReactNode; // Task list
}

/**
 * MorningPlanningTab - Morning planning interface
 */
export function MorningPlanningTab({
  editing,
  todayTasks,
  objectiveGroups,
  newFreeTask,
  mood,
  energy,
  completedCount,
  totalEstimated,
  progressPct,
  onSetNewFreeTask,
  onSetMood,
  onSetEnergy,
  onAddFreeTask,
  onSelectTaskFromObjective,
  onRemoveTask,
  onSaveMorningPlan,
  onSetEditing,
  children,
}: MorningPlanningTabProps) {
  const todayLabel = formatTodayLabel();

  return (
    <div className="space-y-4">
      {/* ── Date + badge ── */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[hsl(var(--body-strong))]">
          {todayLabel}
        </span>
        {todayTasks.length > 0 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
            {todayTasks.length - completedCount} task
            {todayTasks.length - completedCount !== 1 ? "s" : ""} remaining
          </span>
        )}
      </div>

      {/* ═══ EDITING MODE ═══ */}
      {editing && (
        <div className="space-y-4">
          {/* Objective task selector */}
          <ObjectiveTaskSelector
            objectiveGroups={objectiveGroups}
            onSelectTask={onSelectTaskFromObjective}
          />

          {/* Free task input */}
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
              Add a free task
            </p>
            <div className="flex gap-2">
              <Input
                value={newFreeTask}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onSetNewFreeTask(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && onAddFreeTask()
                }
                placeholder="Task title..."
                className="h-8 text-[12px]"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 shrink-0"
                onClick={onAddFreeTask}
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
                    onClick={() => onRemoveTask(task.id)}
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
            <span className="text-[11px] text-[hsl(var(--muted))]">Mood</span>
            <div className="flex gap-1">
              {MOODS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onSetMood(i)}
                  className={`text-[16px] transition-all ${
                    mood === i ? "scale-125" : "opacity-40 hover:opacity-70"
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
                  onClick={() => onSetEnergy(n)}
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
            onClick={onSaveMorningPlan}
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
                      · <Clock size={9} className="inline mb-0.5" />{" "}
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
            <div className="space-y-2">{children}</div>
          )}

          {/* Edit plan button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSetEditing(true)}
          >
            Edit plan
          </Button>
        </div>
      )}
    </div>
  );
}
