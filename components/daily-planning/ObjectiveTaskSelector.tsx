"use client";

import React from "react";
import { Check } from "lucide-react";
import type { Goal, WeeklyObjective, Task } from "@/lib/types";
import { GOAL_COLOR_MAP } from "@/lib/constants";

interface ObjectiveGroup {
  objective: WeeklyObjective;
  goal: Goal;
  tasks: Task[];
  todayTaskIds: Set<string>;
}

interface ObjectiveTaskSelectorProps {
  objectiveGroups: ObjectiveGroup[];
  onSelectTask: (task: Task) => void;
}

/**
 * ObjectiveTaskSelector - Select tasks from weekly objectives to add to today's plan
 * Memoized to prevent unnecessary re-renders
 */
export const ObjectiveTaskSelector = React.memo(function ObjectiveTaskSelector({
  objectiveGroups,
  onSelectTask,
}: ObjectiveTaskSelectorProps) {
  if (objectiveGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
        Select from weekly objectives
      </p>
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        {objectiveGroups.map(({ objective, goal, tasks, todayTaskIds }) => (
          <div key={objective.id} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  GOAL_COLOR_MAP[goal.color as keyof typeof GOAL_COLOR_MAP] ?? GOAL_COLOR_MAP.Purple
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
                  onClick={() => !isAdded && onSelectTask(task)}
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
                    {isAdded && <Check size={9} className="text-white" />}
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
        ))}
      </div>
      <p className="text-[10px] text-[hsl(var(--muted))] pt-0.5">
        🎯 Focus: pick 2–5 tasks for the day
      </p>
    </div>
  );
});
