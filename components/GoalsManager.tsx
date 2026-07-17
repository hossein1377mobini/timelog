"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Plus, ChevronDown, ChevronRight, Trash2, Pencil, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Goal, RoadmapNode } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { fetchGoals, createGoal, updateGoal, deleteGoal, fetchRoadmapTree, addRoadmapNode, updateRoadmapNodeDb, deleteRoadmapNodeDb } from "@/lib/db-client"
import { EMPTY_GOAL_FORM } from "@/lib/constants"
import { GoalCard, GoalFormDialog, GoalsSummaryBar } from "./goals"
import type { FormState } from "./goals/goalHelpers"
import { useSessionsDb } from "@/lib/hooks/useDb"

type Milestone = {
  id?: string
  name: string
  description: string
  status: "pending" | "completed"
}

export default function GoalsManager() {
  const [goals, setGoalsState] = useState<Goal[]>([])
  const { data: sessionsData } = useSessionsDb()
  const sessions = sessionsData ?? []
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loadingMilestones, setLoadingMilestones] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    fetchGoals().then(setGoalsState).catch(console.error)
  }

  async function handleSave() {
    if (!validate()) return

    try {
      let goalId = editingId

      if (editingId !== null) {
        await updateGoal(editingId, { name: name.trim() })
      } else {
        const newGoal = await createGoal({
          name: name.trim(),
          description: "",
          category: "",
          tag: `#${name.trim().toLowerCase().replace(/\s+/g, "-")}`,
          targetHours: 0,
          targetDate: "",
          weeklyTarget: 0,
          priority: "medium",
          status: "active",
          color: "amber",
        })
        goalId = newGoal.id
      }

      // Save milestones
      if (goalId && milestones.length > 0) {
        const existingTree = await fetchRoadmapTree(goalId)
        const existingNodes = Object.values(existingTree)

        // Get milestone IDs that were kept (have an id)
        const keptIds = new Set(milestones.filter((m) => m.id).map((m) => m.id))

        // Delete milestones that were removed
        for (const node of existingNodes) {
          if (node.type === "objective" && !keptIds.has(node.id)) {
            try {
              await deleteRoadmapNodeDb(node.id)
            } catch (e) {
              console.error("Failed to delete milestone:", e)
            }
          }
        }

        // Create new milestones or update existing ones
        const newMilestones = milestones.filter((m) => m.name.trim())

        for (let i = 0; i < newMilestones.length; i++) {
          const ms = newMilestones[i]
          if (!ms) continue
          if (ms.id) {
            // Update existing
            try {
              await updateRoadmapNodeDb(ms.id, {
                name: ms.name,
                status: ms.status,
                order: i,
              })
            } catch (e) {
              console.error("Failed to update milestone:", e)
            }
          } else {
            // Create new
            try {
              await addRoadmapNode(goalId, {
                type: "objective",
                name: ms.name,
                description: "",
                goalId,
                parentId: null,
                children: [],
                status: ms.status,
                order: i,
              })
            } catch (e) {
              console.error("Failed to create milestone:", e)
            }
          }
        }
      } else if (goalId) {
        // No milestones left - delete all existing roadmap nodes
        try {
          const existingTree = await fetchRoadmapTree(goalId)
          for (const node of Object.values(existingTree)) {
            if (node.type === "objective") {
              await deleteRoadmapNodeDb(node.id)
            }
          }
        } catch (e) {
          console.error("Failed to clean up milestones:", e)
        }
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
    setName("")
    setNameError("")
    setMilestones([])
    setOpen(true)
  }

  async function openEdit(goal: Goal) {
    setEditingId(goal.id)
    setName(goal.name)
    setNameError("")
    setOpen(true)

    // Load existing milestones
    setLoadingMilestones(true)
    try {
      const tree = await fetchRoadmapTree(goal.id)
      const existingMilestones = Object.values(tree)
        .filter((node) => node.type === "objective" && !node.parentId)
        .sort((a, b) => a.order - b.order)
        .map((node) => ({
          id: node.id,
          name: node.name,
          description: "",
          status: (node.status === "in-progress" ? "pending" : node.status) as "pending" | "completed",
        }))
      setMilestones(existingMilestones)
    } catch (e) {
      console.error("Failed to load milestones:", e)
      setMilestones([])
    } finally {
      setLoadingMilestones(false)
    }
  }

  function addMilestone(milestoneName: string) {
    const trimmed = milestoneName.trim()
    if (!trimmed) return
    
    // Check for duplicates (case-insensitive)
    const exists = milestones.some(m => m.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      return // Silently ignore duplicates - could add toast later
    }
    
    setMilestones((prev) => [
      ...prev,
      { name: trimmed, description: "", status: "pending" },
    ])
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index))
  }

  function validate(): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError("Name is required")
      return false
    }
    setNameError("")
    return true
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
              <Target size={14} className="text-hsl(var(--muted))" />
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
              className="border border-dashed border-hsl(var(--border-strong)) rounded-[12px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-hsl(var(--border)) hover:bg-hsl(var(--canvas-soft)) transition-all group">
              <Target size={20} className="text-hsl(var(--muted)) group-hover:text-hsl(var(--foreground)) transition-colors" />
              <p className="text-[14px] text-hsl(var(--muted)) group-hover:text-hsl(var(--foreground)) transition-colors">Add your first goal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} sessions={sessions}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => setDeleteConfirm(goal.id)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal + Milestones Form Dialog */}
      <GoalFormDialog
        open={open}
        onClose={() => setOpen(false)}
        editingId={editingId}
        name={name}
        nameError={nameError}
        onNameChange={setName}
        onSave={handleSave}
        milestones={milestones}
        onAddMilestone={addMilestone}
        onRemoveMilestone={removeMilestone}
      />

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <Dialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold">Delete goal?</DialogTitle>
            </DialogHeader>
            <p className="text-[14px] text-hsl(var(--muted)) py-1">
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