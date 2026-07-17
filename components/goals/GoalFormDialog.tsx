"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"

interface MilestoneItem {
  id?: string
  name: string
  description: string
}

interface Props {
  open: boolean
  onClose: () => void
  editingId: string | null
  name: string
  nameError?: string
  onNameChange: (val: string) => void
  onSave: () => void
  milestones: MilestoneItem[]
  onAddMilestone: (name: string) => void
  onRemoveMilestone: (index: number) => void
}

export function GoalFormDialog({
  open,
  onClose,
  editingId,
  name,
  nameError,
  onNameChange,
  onSave,
  milestones,
  onAddMilestone,
  onRemoveMilestone,
}: Props) {
  const [milestoneInput, setMilestoneInput] = useState("")

  function handleAddMilestone() {
    const mName = milestoneInput.trim()
    if (!mName) return
    onAddMilestone(mName)
    setMilestoneInput("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">
            {editingId ? "Edit goal" : "New goal"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Name</label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
              placeholder="e.g. Complete PhD thesis"
              className="h-10 text-[14px]"
            />
            {nameError && <p className="text-[11px] text-[hsl(var(--error))]">{nameError}</p>}
          </div>

          {/* Milestones separator */}
          <hr className="border-[hsl(var(--hairline))]" />

          {/* Milestones section */}
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Milestones (optional)</label>

            {/* Existing milestones list */}
            {milestones.length > 0 && (
              <div className="space-y-1.5">
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[6px] bg-[hsl(var(--surface-soft))]"
                  >
                    <span className="text-[13px] text-[hsl(var(--body))]">{m.name}</span>
                    <button
                      onClick={() => onRemoveMilestone(i)}
                      className="text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors shrink-0"
                      aria-label="Remove milestone"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add milestone input */}
            <div className="flex gap-2">
              <Input
                value={milestoneInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddMilestone()
                  }
                }}
                placeholder="Milestone name"
                className="h-8 text-[13px] flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddMilestone}
                className="h-8 text-[12px] px-3 gap-1"
              >
                <Plus size={12} /> Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            {editingId ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
