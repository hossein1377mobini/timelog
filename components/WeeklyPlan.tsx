"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { EmptyState } from "./weekly-plan/EmptyState"
import { GoalSection } from "./weekly-plan/GoalSection"
import { WizardStep1 } from "./weekly-plan/WizardStep1"
import { WizardStep2 } from "./weekly-plan/WizardStep2"
import EditObjectiveDialog from "./weekly-plan/EditObjectiveDialog"
import AddDailyTaskDialog from "./weekly-plan/AddDailyTaskDialog"
import { useWeeklyPlan } from "./weekly-plan/useWeeklyPlan"
import type { Goal, WeeklyObjective } from "@/lib/types"

export default function WeeklyPlan() {
  const t = useWeeklyPlan()

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <CalendarDays size={14} className="text-[hsl(var(--muted))]" />
              Weekly plan
            </CardTitle>
            <Button
              size="sm" variant="outline"
              onClick={t.openWizard}
              className="h-7 text-[12px] px-3 transition-all hover:scale-[1.01] active:scale-[0.97]"
            >
              {t.goalGroups.length > 0 ? "Edit plan" : "Set up week"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {t.goalGroups.length === 0 ? (
            <EmptyState onOpen={t.openWizard} />
          ) : (
            <div className="space-y-3">
              {t.goalGroups.map(({ goal, objectives: objs, logged }) => (
                <GoalSection
                  key={goal.id}
                  goal={goal}
                  objectives={objs}
                  logged={logged}
                  expanded={t.expanded[goal.id] !== false}
                  onToggleExpand={() =>
                    t.setExpanded((prev: Record<string, boolean>) => ({
                      ...prev,
                      [goal.id]: prev[goal.id] === false,
                    }))
                  }
                  onCycleStatus={t.cycleStatus}
                  onEdit={t.openEdit}
                  onDelete={t.deleteObj}
                  onAddTask={(obj: WeeklyObjective) => { t.setAddTaskObj(obj); t.setNewTaskTitle("") }}
                  addingToGoalId={t.addingToGoalId}
                  newObjTitle={t.newObjTitle}
                  newObjDesc={t.newObjDesc}
                  onOpenAddForm={() => { t.setAddingToGoalId(goal.id); t.setNewObjTitle(""); t.setNewObjDesc("") }}
                  onCancelAddForm={() => t.setAddingToGoalId(null)}
                  onChangeTitle={t.setNewObjTitle}
                  onChangeDesc={t.setNewObjDesc}
                  onAddObjective={t.addObjective}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup / Edit wizard */}
      <Dialog open={t.wizardOpen} onOpenChange={(open) => { if (!open) t.closeWizard() }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
          {t.wizardStep === 1 ? (
            <WizardStep1
              goals={t.goals as Goal[]}
              selectedGoalIds={t.selectedGoalIds}
              hourTargets={t.hourTargets}
              onToggleGoal={t.toggleGoalSelection}
              onChangeHours={(id: string, val: number) =>
                t.setHourTargets((prev: Record<string, number>) => ({ ...prev, [id]: val }))
              }
              onCancel={t.closeWizard}
              onContinue={t.goToStep2}
            />
          ) : (
            <WizardStep2
              goals={t.goals.filter((g: Goal) => t.selectedGoalIds.includes(g.id))}
              objectives={t.objectives}
              focusedGoalId={t.focusedGoalId}
              weekKey={t.weekKey}
              weekEnd={t.weekEnd}
              onFocusGoal={t.setFocusedGoalId}
              onBack={() => t.setWizardStep(1)}
              onDone={t.closeWizard}
              onAddObjective={async (goalId: string, title: string, desc: string) => {
                /* WizardStep2 provides direct params — handled inline by sub-component */
              }}
              onCycleStatus={t.cycleStatus}
              onEditObjective={t.openEdit}
              onDeleteObjective={t.deleteObj}
              onAddTask={(obj: WeeklyObjective) => { t.setAddTaskObj(obj); t.setNewTaskTitle("") }}
            />
          )}
        </DialogContent>
      </Dialog>

      <EditObjectiveDialog
        editingObj={t.editingObj}
        editTitle={t.editTitle}
        editDesc={t.editDesc}
        onSetTitle={t.setEditTitle}
        onSetDesc={t.setEditDesc}
        onSave={t.saveEdit}
        onClose={() => t.setEditingObj(null)}
      />

      <AddDailyTaskDialog
        addTaskObj={t.addTaskObj}
        newTaskTitle={t.newTaskTitle}
        onSetTitle={t.setNewTaskTitle}
        onAdd={t.addDailyTask}
        onClose={() => t.setAddTaskObj(null)}
      />
    </>
  )
}
