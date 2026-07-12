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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface Props {
  editingObj: { id: string; title: string; description: string } | null
  editTitle: string
  editDesc: string
  onSetTitle: (v: string) => void
  onSetDesc: (v: string) => void
  onSave: () => void
  onClose: () => void
}

export default function EditObjectiveDialog({
  editingObj, editTitle, editDesc,
  onSetTitle, onSetDesc, onSave, onClose,
}: Props) {
  return (
    <Dialog open={editingObj !== null} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Edit objective</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Title</label>
            <Input
              value={editTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetTitle(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && onSave()}
              className="h-9 text-[14px]"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Description</label>
            <Textarea
              value={editDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSetDesc(e.target.value)}
              placeholder="Optional details..."
              className="resize-none h-20 text-[13px]"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave} disabled={!editTitle.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
