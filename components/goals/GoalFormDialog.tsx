"use client"

import React from "react"
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

interface Props {
  open: boolean
  onClose: () => void
  editingId: string | null
  form: FormState
  errors: Partial<FormState>
  onFieldChange: (key: keyof FormState, val: string | number) => void
  onSave: () => void
}

export function GoalFormDialog({ open, onClose, editingId, form, errors, onFieldChange, onSave }: Props) {
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
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave}>{editingId ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
