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
import { GOAL_COLORS, EMPTY_GOAL_FORM } from "@/lib/constants"
import type { FormState } from "./goalHelpers"
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
  form: FormState
  errors: Partial<FormState>
  onFieldChange: (key: keyof FormState, val: string | number) => void
  onSave: () => void
  milestones: MilestoneItem[]
  onAddMilestone: (name: string) => void
  onRemoveMilestone: (index: number) => void
}

export function GoalFormDialog({ open, onClose, editingId, form, errors, onFieldChange, onSave, milestones, onAddMilestone, onRemoveMilestone }: Props) {
  const [milestoneInput, setMilestoneInput] = useState("")

  function handleAddMilestone() {
    const name = milestoneInput.trim()
    if (!name) return
    onAddMilestone(name)
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
            <Input value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange("name", e.target.value)}
              placeholder="e.g. Complete PhD thesis"
              className="h-10 text-[14px]" />
            {errors.name && <p className="text-[11px] text-[hsl(var(--error))]">{errors.name}</p>}
          </div>

          {/* Tag */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Tag</label>
            <Input value={form.tag}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange("tag", e.target.value)}
              placeholder="#research"
              className="h-10 text-[14px]" />
            {errors.tag && <p className="text-[11px] text-[hsl(var(--error))]">{errors.tag}</p>}
          </div>

          {/* Target hours */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Target hours</label>
            <Input type="number" min={1} value={form.targetHours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange("targetHours", Number(e.target.value))}
              className="h-10 text-[14px]" />
            {errors.targetHours && <p className="text-[11px] text-[hsl(var(--error))]">{String(errors.targetHours)}</p>}
          </div>

          {/* Weekly target */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Weekly target (hours)</label>
            <Input type="number" min={1} value={form.weeklyTarget}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange("weeklyTarget", Number(e.target.value))}
              className="h-10 text-[14px]" />
            {errors.weeklyTarget && <p className="text-[11px] text-[hsl(var(--error))]">{String(errors.weeklyTarget)}</p>}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Deadline (optional)</label>
            <Input type="date" value={form.deadline}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange("deadline", e.target.value)}
              className="h-10 text-[14px]" />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c.name}
                  onClick={() => onFieldChange("color", c.name)}
                  className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90 ${
                    form.color === c.name ? "border-[hsl(var(--body-strong))] scale-110" : "border-transparent"
                  }`}
                  style={{ background: c.value }}
                  aria-label={c.name} />
              ))}
            </div>
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
                  <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[6px] bg-[hsl(var(--surface-soft))]">
                    <span className="text-[13px] text-[hsl(var(--body))]">{m.name}</span>
                    <button
                      onClick={() => onRemoveMilestone(i)}
                      className="text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-colors shrink-0"
                      aria-label="Remove milestone">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add milestone input */}
            <div className="flex gap-2">
              <Input value={milestoneInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestoneInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddMilestone()
                  }
                }}
                placeholder="Milestone name"
                className="h-8 text-[13px] flex-1" />
              <Button size="sm" onClick={handleAddMilestone}
                className="h-8 text-[12px] px-3 gap-1">
                <Plus size={12} /> Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave}>{editingId ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
