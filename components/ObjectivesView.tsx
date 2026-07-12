"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check, ArrowRight, CalendarDays } from "lucide-react"
import YearGrid from "./objectives/YearGrid"
import AddObjectiveSheet from "./objectives/AddObjectiveSheet"
import WeeklyReflection from "./objectives/WeeklyReflection"
import GoalObjectivePanel from "./objectives/GoalObjectivePanel"
import { useObjectivesView } from "./objectives/useObjectivesView"

export default function ObjectivesView() {
  const t = useObjectivesView()

  if (t.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
            Weekly Objectives
          </p>
          <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]" />
        </div>
        <Button onClick={() => t.setShowAddSheet(true)} className="h-10 text-[13px] gap-1.5">
          <Plus size={14} /> Add Objective
        </Button>
      </div>

      {/* Year Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-medium">Year Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <YearGrid weeks={t.yearWeeks} currentWeekStart={t.weekKey} onWeekClick={() => {}} />
        </CardContent>
      </Card>

      {/* Current Week Objectives */}
      {t.activeGoals.length > 0 ? (
        <div className="space-y-4">
          {t.activeGoals.map((goal) => {
            const goalObjectives = t.objectivesWithGoals.filter((o) => o.goalId === goal.id)
            const completedCount = goalObjectives.filter((o) => o.status === "completed").length
            return (
              <Card key={goal.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                      <span className="text-[13px] font-medium text-[hsl(var(--body-strong))]">{goal.name}</span>
                    </div>
                    <span className="text-[11px] text-[hsl(var(--muted))]">
                      {completedCount}/{goalObjectives.length} done
                    </span>
                  </div>
                  <GoalObjectivePanel objectives={goalObjectives} onCycleStatus={t.cycleStatus} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <CalendarDays size={32} className="mx-auto text-[hsl(var(--muted))] mb-3" />
            <p className="text-[13px] text-[hsl(var(--muted))] mb-3">No active goals yet</p>
            <Button onClick={() => t.setShowAddSheet(true)} variant="outline">
              <Plus size={14} className="mr-1.5" /> Create a Goal First
            </Button>
          </CardContent>
        </Card>
      )}

      {/* End This Week */}
      <div className="pt-2 pb-4">
        <Button onClick={t.handleEndWeek} className="w-full h-11 text-[14px] font-medium" variant="outline">
          <Check size={16} className="mr-2" /> End This Week <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* Weekly Reflection */}
      {t.showWeeklyReflection && (
        <WeeklyReflection
          unfinishedObjectives={t.objectives.filter((o) => o.status !== "completed")}
          weekStart={t.weekKey}
          weekEnd={t.weekEnd}
          onDone={t.handleReflectionDone}
          onClose={t.handleReflectionClose}
        />
      )}

      {/* Add Objective Sheet */}
      <AddObjectiveSheet
        open={t.showAddSheet}
        onClose={() => t.setShowAddSheet(false)}
        onAdd={t.handleAddObjective}
        goals={t.goals}
        roadmapTrees={t.roadmapTrees}
        weekKey={t.weekKey}
        weekEnd={t.weekEnd}
      />
    </div>
  )
}
