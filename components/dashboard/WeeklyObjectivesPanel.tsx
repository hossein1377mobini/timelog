"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import type { Goal, WeeklyObjective } from "@/lib/types";

interface WeeklyObjectivesPanelProps {
  objectives: WeeklyObjective[];
  goals: Goal[];
}

function mapColor(color: string | undefined): string {
  switch (color) {
    case "Teal": return "#0F6E56";
    case "Purple": return "#534AB7";
    case "Amber": return "#854F0B";
    case "Blue": return "#185FA5";
    case "Coral": return "#993C1D";
    default: return "#6B7280";
  }
}

export default function WeeklyObjectivesPanel({ objectives, goals }: WeeklyObjectivesPanelProps) {
  if (objectives.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
          Weekly Objectives
        </p>
        {objectives.map((obj) => {
          const goal = goals.find((g) => g.id === obj.goalId);
          return (
            <div key={obj.id} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: mapColor(goal?.color) }}
              />
              <span className="text-[12px] text-[hsl(var(--body))] truncate flex-1">
                {obj.title}
              </span>
              <ChevronRight size={12} className="text-[hsl(var(--muted))] shrink-0" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
