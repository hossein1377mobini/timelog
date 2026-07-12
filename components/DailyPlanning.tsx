"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Moon } from "lucide-react"
import { TaskItem } from "./daily-planning/TaskItem"
import { TaskEditDialog } from "./daily-planning/TaskEditDialog"
import { MorningPlanningTab } from "./daily-planning/MorningPlanningTab"
import { EveningReflectionTab } from "./daily-planning/EveningReflectionTab"
import { useDailyPlanning } from "./daily-planning/useDailyPlanning"

export default function DailyPlanning() {
  const t = useDailyPlanning()

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Sun size={14} className="text-[hsl(var(--muted))]" />
              Daily Planning
            </CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => t.setTab("morning")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  t.tab === "morning"
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                }`}
              >
                <Sun size={11} className="inline mr-1" /> Morning
              </button>
              <button
                onClick={() => t.setTab("evening")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  t.tab === "evening"
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
                }`}
              >
                <Moon size={11} className="inline mr-1" /> Evening
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {t.tab === "morning" && (
            <MorningPlanningTab
              editing={t.editing}
              todayTasks={t.todayTasks}
              objectiveGroups={t.objectiveGroups}
              newFreeTask={t.newFreeTask}
              mood={t.mood}
              energy={t.energy}
              completedCount={t.completedCount}
              totalEstimated={t.totalEstimated}
              progressPct={t.progressPct}
              onSetNewFreeTask={t.setNewFreeTask}
              onSetMood={t.setMood}
              onSetEnergy={t.setEnergy}
              onAddFreeTask={t.addFreeTask}
              onSelectTaskFromObjective={t.selectTaskFromObjective}
              onRemoveTask={t.removeTask}
              onSaveMorningPlan={t.saveMorningPlan}
              onSetEditing={t.setEditing}
            >
              {t.todayTasks.map((task) => {
                const goalInfo =
                  task.objectiveId && t.objectiveGoalMap.has(task.objectiveId)
                    ? t.objectiveGoalMap.get(task.objectiveId)!
                    : null
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    goalInfo={goalInfo}
                    checklistOpen={t.openChecklists.has(task.id)}
                    onCycleStatus={t.cycleStatus}
                    onToggleChecklist={t.toggleChecklist}
                    onToggleChecklistItem={t.toggleChecklistItem}
                    onEdit={t.openEdit}
                    onRemove={t.removeTask}
                  />
                )
              })}
            </MorningPlanningTab>
          )}

          {t.tab === "evening" && (
            <EveningReflectionTab
              accomplishments={t.accomplishments}
              distractions={t.distractions}
              rating={t.rating}
              differently={t.differently}
              gratitude={t.gratitude}
              tomorrowFocus={t.tomorrowFocus}
              eveningMood={t.eveningMood}
              newAccomplishment={t.newAccomplishment}
              newDistraction={t.newDistraction}
              newDifferently={t.newDifferently}
              onSetAccomplishments={t.setAccomplishments}
              onSetDistractions={t.setDistractions}
              onSetRating={t.setRating}
              onSetDifferently={t.setDifferently}
              onSetGratitude={t.setGratitude}
              onSetTomorrowFocus={t.setTomorrowFocus}
              onSetEveningMood={t.setEveningMood}
              onSetNewAccomplishment={t.setNewAccomplishment}
              onSetNewDistraction={t.setNewDistraction}
              onSetNewDifferently={t.setNewDifferently}
              onSaveEveningReflection={t.saveEveningReflection}
            />
          )}
        </CardContent>
      </Card>

      <TaskEditDialog
        editState={t.editState}
        onClose={() => t.setEditState(null)}
        onSave={t.saveEdit}
        onUpdateEditState={t.setEditState}
        onAddChecklistItem={t.addChecklistItem}
        onRemoveChecklistItem={t.removeChecklistItem}
        onToggleChecklistItem={t.toggleEditChecklistItem}
      />
    </>
  )
}
