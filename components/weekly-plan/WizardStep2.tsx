import React, { useState } from "react";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
import type { Goal, WeeklyObjective } from "@/lib/types";
import { ObjectiveCard } from "./ObjectiveCard";
import { GOAL_COLOR_RECORD } from "@/lib/constants";

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

export const WizardStep2 = React.memo(function WizardStep2({
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

  const color = GOAL_COLOR_RECORD[focusedGoal.color as keyof typeof GOAL_COLOR_RECORD] || GOAL_COLOR_RECORD.Purple;

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
              const c = GOAL_COLOR_RECORD[g.color as keyof typeof GOAL_COLOR_RECORD] || GOAL_COLOR_RECORD.Purple;
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
              placeholder="Objective title..."
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
});
