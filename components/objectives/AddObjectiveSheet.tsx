"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, ChevronRight, Check } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import type { Goal, RoadmapNode, WeeklyObjective } from "@/lib/types";
import type { RoadmapTree } from "@/lib/types";

interface AddObjectiveSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (objective: {
    goalId: string;
    milestoneId: string | null;
    title: string;
    description: string;
  }) => void;
  goals: Goal[];
  roadmapTrees: Record<string, RoadmapTree>;
  weekKey: string;
  weekEnd: string;
}

type Step = "goal" | "milestone" | "name";

export default function AddObjectiveSheet({
  open,
  onClose,
  onAdd,
  goals,
  roadmapTrees,
  weekKey,
  weekEnd,
}: AddObjectiveSheetProps) {
  const [step, setStep] = useState<Step>("goal");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapNode | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const activeGoals = goals.filter((g) => g.status === "active");

  // Get milestones for the selected goal
  const milestones = useMemo(() => {
    if (!selectedGoal) return [];
    const tree = roadmapTrees[selectedGoal.id];
    if (!tree) return [];
    // Return all nodes that are "objective" type (the user called them milestones)
    return Object.values(tree).filter(
      (node) => node.type === "objective" && !node.parentId
    );
  }, [selectedGoal, roadmapTrees]);

  // Also get child milestones (nested ones)
  const allMilestones = useMemo(() => {
    if (!selectedGoal) return [];
    const tree = roadmapTrees[selectedGoal.id];
    if (!tree) return [];
    return Object.values(tree).filter((node) => node.type === "objective");
  }, [selectedGoal, roadmapTrees]);

  function handleGoalSelect(goal: Goal) {
    setSelectedGoal(goal);
    setStep("milestone");
  }

  function handleMilestoneSelect(milestone: RoadmapNode | null) {
    setSelectedMilestone(milestone);
    setStep("name");
    setTitle("");
    setDescription("");
  }

  function handleSave() {
    if (!selectedGoal || !title.trim()) return;
    onAdd({
      goalId: selectedGoal.id,
      milestoneId: selectedMilestone?.id ?? null,
      title: title.trim(),
      description: description.trim(),
    });
    reset();
    onClose();
  }

  function reset() {
    setStep("goal");
    setSelectedGoal(null);
    setSelectedMilestone(null);
    setTitle("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-3">
      {(["goal", "milestone", "name"] as Step[]).map((s, i) => {
        const isActive = step === s;
        const isDone =
          (s === "goal" && selectedGoal) ||
          (s === "milestone" && (selectedMilestone !== null || step === "name"));
        return (
          <React.Fragment key={s}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                isActive
                  ? "bg-[hsl(var(--primary))] text-white"
                  : isDone
                  ? "bg-[hsl(var(--success))] text-white"
                  : "bg-[hsl(var(--surface-strong))] text-[hsl(var(--muted))]"
              }`}
            >
              {isDone ? <Check size={12} /> : i + 1}
            </div>
            {i < 2 && (
              <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <BottomSheet open={open} onClose={handleClose} title="Add Objective">
      {stepIndicator}

      {/* Step 1: Pick a Goal */}
      {step === "goal" && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Choose a goal
          </p>
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {activeGoals.length === 0 ? (
              <p className="text-[13px] text-[hsl(var(--muted))] text-center py-4">
                No active goals. Create a goal first.
              </p>
            ) : (
              activeGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/5 transition-colors text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[hsl(var(--body-strong))] truncate">
                      {goal.name}
                    </p>
                    {goal.description && (
                      <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-[hsl(var(--muted))] shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: Pick a Milestone */}
      {step === "milestone" && (
        <div className="space-y-3">
          <button
            onClick={() => setStep("goal")}
            className="flex items-center gap-1 text-[12px] text-[hsl(var(--primary))] hover:underline"
          >
            <ArrowLeft size={12} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedGoal?.color }}
            />
            <p className="text-[13px] font-medium text-[hsl(var(--body-strong))]">
              {selectedGoal?.name}
            </p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Choose a milestone (or skip)
          </p>

          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            <button
              onClick={() => handleMilestoneSelect(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-dashed border-[hsl(var(--hairline))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/5 transition-colors text-left"
            >
              <Plus size={14} className="text-[hsl(var(--muted))] shrink-0" />
              <span className="text-[13px] text-[hsl(var(--muted))]">
                Skip — just a general objective
              </span>
            </button>

            {allMilestones.map((ms) => (
              <button
                key={ms.id}
                onClick={() => handleMilestoneSelect(ms)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/5 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[hsl(var(--body-strong))] truncate">
                    {ms.name}
                  </p>
                  {ms.description && (
                    <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                      {ms.description}
                    </p>
                  )}
                </div>
                <ChevronRight size={14} className="text-[hsl(var(--muted))] shrink-0" />
              </button>
            ))}

            {allMilestones.length === 0 && (
              <p className="text-[13px] text-[hsl(var(--muted))] text-center py-4">
                No milestones in this goal&apos;s roadmap. You can add one later.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Name the Objective */}
      {step === "name" && (
        <div className="space-y-3">
          <button
            onClick={() => setStep("milestone")}
            className="flex items-center gap-1 text-[12px] text-[hsl(var(--primary))] hover:underline"
          >
            <ArrowLeft size={12} />
            Back
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedGoal?.color }}
              />
              <p className="text-[12px] text-[hsl(var(--muted))]">
                {selectedGoal?.name}
                {selectedMilestone && (
                  <span className="text-[hsl(var(--body-strong))]">
                    {" "}→ {selectedMilestone.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              Objective name
            </label>
            <Input
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="What do you want to achieve this week?"
              className="h-9 text-[13px]"
              autoFocus
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Any details about this objective..."
              className="resize-none h-16 text-[13px]"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full h-10 text-[13px]"
          >
            <Plus size={14} className="mr-1.5" />
            Add Objective
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
