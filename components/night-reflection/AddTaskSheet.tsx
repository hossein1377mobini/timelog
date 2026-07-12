"use client";

import React from "react";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus } from "lucide-react";
import type { WeeklyObjective, Goal } from "@/lib/types";

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  objectives: WeeklyObjective[];
  objectiveGoalMap: Map<string, { objective: WeeklyObjective; goal: Goal }>;
  selectedObjIds: Set<string>;
  onToggleObjective: (objId: string) => void;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onAddNewTask: () => void;
}

export default function AddTaskSheet({
  open,
  onClose,
  objectives,
  objectiveGoalMap,
  selectedObjIds,
  onToggleObjective,
  newTaskTitle,
  onNewTaskTitleChange,
  onAddNewTask,
}: AddTaskSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add Task for Tomorrow"
    >
      <div className="space-y-4">
        {/* Weekly objective picker */}
        {objectives.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              From Weekly Objectives
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {objectives.map((obj) => {
                const info = objectiveGoalMap.get(obj.id);
                const selected = selectedObjIds.has(obj.id);
                return (
                  <label
                    key={obj.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border cursor-pointer transition-colors ${
                      selected
                        ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                        : "border-[hsl(var(--hairline))]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selected
                          ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                          : "border-[hsl(var(--hairline-strong))]"
                      }`}
                    >
                      {selected && <Check size={10} className="text-white" />}
                    </div>
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => onToggleObjective(obj.id)}
                    >
                      <p className="text-[13px] text-[hsl(var(--body-strong))] truncate">
                        {obj.title}
                      </p>
                      {info && (
                        <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                          {info.goal.name}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Task name */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Task Name
          </p>
          <Input
            value={newTaskTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onNewTaskTitleChange(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && onAddNewTask()
            }
            placeholder="What do you want to do?"
            className="h-9 text-[13px]"
          />
        </div>

        <Button
          onClick={onAddNewTask}
          disabled={!newTaskTitle.trim()}
          className="w-full h-10 text-[13px]"
        >
          <Plus size={14} className="mr-1.5" />
          Add to Tomorrow
        </Button>
      </div>
    </BottomSheet>
  );
}
