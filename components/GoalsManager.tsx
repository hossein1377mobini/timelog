"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Goal, Session } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { fetchGoals, createGoal, updateGoal, deleteGoal } from "@/lib/db-client"
import { EMPTY_GOAL_FORM } from "@/lib/constants"
import { GoalCard, GoalFormDialog, GoalsSummaryBar } from "./goals"
import type { FormState } from "./goals/goalHelpers"
import { useSessionsDb } from "@/lib/hooks/useDb"

export default function GoalsManager() {
  const [goals, setGoalsState] = useState<Goal[]>([])
  const { data: sessionsData } = useSessionsDb()
  const sessions = sessionsData ?? []
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_GOAL_FORM)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    fetchGoals().then(setGoalsState).catch(console.error)
  }

  async function handleSave() {
    if (!validate()) return
    const tag = form.tag.trim().startsWith("#") ? form.tag.trim() : `#${form.tag.trim()}`
    try {
      if (editingId !== null) {
        await updateGoal(editingId, {
          name: form.name.trim(),
          tag,
          targetHours: Number(form.targetHours),
          targetDate: form.deadline,
          weeklyTarget: Number(form.weeklyTarget),
          color: form.color,
        })
      } else {
        await createGoal({
          name: form.name.trim(),
          description: "",
          category: "",
          tag,
          targetHours: Number(form.targetHours),
          targetDate: form.deadline,
          weeklyTarget: Number(form.weeklyTarget),
          priority: "medium",
          status: "active",
          color: form.color,
        })
      }
      loadData()
    } catch (e) {
      console.error("Failed to save goal:", e)
    }
    setOpen(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal(id)
      loadData()
    } catch (e) {
      console.error("Failed to delete goal:", e)
    }
    setDeleteConfirm(null)
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_GOAL_FORM)
    setErrors({})
    setOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      name: goal.name,
      tag: goal.tag,
      targetHours: goal.targetHours,
      deadline: goal.targetDate || "",
      weeklyTarget: goal.weeklyTarget,
      color: goal.color,
    })
    setErrors({})
    setOpen(true)
  }

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.tag.trim()) e.tag = "Tag is required"
    if (!form.targetHours || form.targetHours <= 0) e.targetHours = 1
    if (!form.weeklyTarget || form.weeklyTarget <= 0) e.weeklyTarget = 1
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function setField(key: keyof FormState, val: string | number) {
    setForm(f => ({ ...f, [key]: val as never }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Target size={14} className="text-[hsl(var(--muted))]" />
              Goals
            </CardTitle>
            <Button size="sm" onClick={openAdd}
              className="h-7 text-[12px] px-3 gap-1 transition-all hover:scale-[1.02] active:scale-[0.97]">
              <Plus size={12} /> Add goal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {goals.length > 0 && <GoalsSummaryBar goals={goals} sessions={sessions} />}

          {goals.length === 0 ? (
            <div onClick={openAdd}
              className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[12px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all group">
              <Target size={20} className="text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors" />
              <p className="text-[14px] text-[hsl(var(--muted))] group-hover:text-[hsl(var(--body-strong))] transition-colors">Add your first goal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} sessions={sessions}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => setDeleteConfirm(goal.id)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <GoalFormDialog open={open} onClose={() => setOpen(false)}
        editingId={editingId} form={form} errors={errors}
        onFieldChange={setField} onSave={handleSave} />

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <Dialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold">Delete goal?</DialogTitle>
            </DialogHeader>
            <p className="text-[14px] text-[hsl(var(--muted))] py-1">
              This will permanently remove this goal and all associated data.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
