"use client"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  addTaskObj: { id: string; title: string; dailyTaskIds: string[] } | null
  newTaskTitle: string
  onSetTitle: (v: string) => void
  onAdd: () => void
  onClose: () => void
}

export default function AddDailyTaskDialog({
  addTaskObj, newTaskTitle, onSetTitle, onAdd, onClose,
}: Props) {
  return (
    <Dialog open={addTaskObj !== null} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">Add daily task</DialogTitle>
        </DialogHeader>
        {addTaskObj && (
          <p className="text-[12px] text-[hsl(var(--muted))] -mt-1 px-1">
            For: <span className="text-[hsl(var(--body-strong))] font-medium">{addTaskObj.title}</span>
          </p>
        )}
        <div className="space-y-2 py-1">
          <Input
            value={newTaskTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetTitle(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && onAdd()}
            placeholder="Task title..."
            className="h-9 text-[13px]"
            autoFocus
          />
          <p className="text-[11px] text-[hsl(var(--muted))]">
            Task will be scheduled for today and linked to this objective.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onAdd} disabled={!newTaskTitle.trim()}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
