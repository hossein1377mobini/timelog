import React from "react";
import { CalendarDays, Check, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTitle } from "@/components/ui/dialog";
import type { Goal } from "@/lib/types";
import { weekLabel } from "@/lib/utils";
import { GOAL_COLOR_RECORD } from "@/lib/constants";

interface WizardStep1Props {
  goals: Goal[];
  selectedGoalIds: string[];
  hourTargets: Record<string, number>;
  onToggleGoal: (id: string) => void;
  onChangeHours: (id: string, val: number) => void;
  onCancel: () => void;
  onContinue: () => void;
}

export const WizardStep1 = React.memo(function WizardStep1({
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
            const color = GOAL_COLOR_RECORD[goal.color as keyof typeof GOAL_COLOR_RECORD] || GOAL_COLOR_RECORD.Purple;
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
});
