"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Plus,
  Save,
  ChevronRight,
} from "lucide-react";
import {
  fetchWeeklyObjectives,
  fetchGoals,
  fetchSessions,
  fetchTasks,
  updateWeeklyObjective,
  saveReflection,
} from "@/lib/db-client";
import type { Task, WeeklyObjective, Goal } from "@/lib/types";
import { weekStartKey, weekEndKey, weekLabel, todayKey, formatHM } from "@/lib/utils";
import BottomSheet from "@/components/BottomSheet";

interface WeeklyReflectionProps {
  unfinishedObjectives: WeeklyObjective[];
  weekStart: string;
  weekEnd: string;
  onDone: () => void;
  onClose: () => void;
}

export default function WeeklyReflection({
  unfinishedObjectives,
  weekStart,
  weekEnd,
  onDone,
  onClose,
}: WeeklyReflectionProps) {
  // ── Objective completion state ───────────────────────────────────────
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  // ── Reflection state ────────────────────────────────────────────────
  const [reflectionText, setReflectionText] = useState("");
  const [rating, setRating] = useState(0);

  // ── Saving ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  // ── Goals map ───────────────────────────────────────────────────────
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchGoals()
      .then((gs) => setGoals(gs.filter((g) => g.status === "active")))
      .catch(console.error);
  }, []);

  const goalMap = useMemo(() => {
    return new Map(goals.map((g) => [g.id, g]));
  }, [goals]);

  function toggleComplete(objId: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(objId)) next.delete(objId);
      else next.add(objId);
      return next;
    });
    // Remove from skipped if toggled complete
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.delete(objId);
      return next;
    });
  }

  function toggleSkip(objId: string) {
    setSkippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(objId)) next.delete(objId);
      else next.add(objId);
      return next;
    });
    // Remove from completed if toggled skip
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.delete(objId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 1. Update objective statuses
      for (const obj of unfinishedObjectives) {
        if (completedIds.has(obj.id)) {
          await updateWeeklyObjective(obj.id, { status: "completed" });
        } else if (skippedIds.has(obj.id)) {
          await updateWeeklyObjective(obj.id, { status: "pending" });
        }
      }

      // 2. Save weekly reflection
      await saveReflection({
        date: weekEnd, // Use weekEnd as the reflection date
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
      console.error("Failed to save weekly reflection:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-[18px] font-semibold text-[hsl(var(--body-strong))]">
          Weekly Reflection
        </h2>
        <p className="text-[12px] text-[hsl(var(--muted))] mt-0.5">
          Close out your week — reflect on progress and plan ahead
        </p>
      </div>

      {/* ── Unfinished objectives ────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Unfinished Objectives — mark completed or skip?
          </p>
          {unfinishedObjectives.length === 0 ? (
            <p className="text-[13px] text-[hsl(var(--muted))] py-2">
              All objectives completed! Great week.
            </p>
          ) : (
            unfinishedObjectives.map((obj) => {
              const goal = goalMap.get(obj.goalId);
              const isCompleted = completedIds.has(obj.id);
              const isSkipped = skippedIds.has(obj.id);

              return (
                <div
                  key={obj.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[hsl(var(--body-strong))] truncate">
                      {obj.title}
                    </p>
                    {goal && (
                      <p className="text-[10px] text-[hsl(var(--muted))] truncate">
                        {goal.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant={isCompleted ? "default" : "outline"}
                      className={`h-7 px-2.5 text-[11px] ${
                        isCompleted
                          ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
                          : ""
                      }`}
                      onClick={() => toggleComplete(obj.id)}
                    >
                      <Check size={12} className="mr-1" />
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant={isSkipped ? "default" : "outline"}
                      className={`h-7 px-2.5 text-[11px] ${
                        isSkipped
                          ? "bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/90 text-white"
                          : ""
                      }`}
                      onClick={() => toggleSkip(obj.id)}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── Reflection ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            How did your week go?
          </p>
          <Textarea
            placeholder="What went well? What could be improved? Key learnings..."
            value={reflectionText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReflectionText(e.target.value)}
            className="text-[13px] resize-none min-h-[80px]"
            rows={3}
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-2">
              Rate Your Week
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= rating ? "opacity-100" : "opacity-30"
                  }`}
                >
                  {star <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save / Cancel ────────────────────────────────────────────── */}
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
          {saving ? "Saving..." : "Save & Close Week"}
        </Button>
      </div>
    </div>
  );
}
