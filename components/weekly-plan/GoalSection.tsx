import React from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Goal, WeeklyObjective } from "@/lib/types";
import { ObjectiveCard } from "./ObjectiveCard";
import { GOAL_COLOR_RECORD } from "@/lib/constants";

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

export const GoalSection = React.memo(function GoalSection({
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
  const color = GOAL_COLOR_RECORD[goal.color as keyof typeof GOAL_COLOR_RECORD] || GOAL_COLOR_RECORD.Purple;
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
                placeholder="Objective title..."
                className="h-8 text-[12px]"
                autoFocus
              />
              <Textarea
                value={newObjDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChangeDesc(e.target.value)
                }
                placeholder="Description (optional)..."
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
});
