"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RoadmapNode, NodeType } from "@/lib/types"

// ── Add dialog ───────────────────────────────────────────────────────────────

interface AddDialogProps {
  open: boolean
  onClose: () => void
  newName: string
  newDesc: string
  newType: NodeType
  error: string
  onNameChange: (v: string) => void
  onDescChange: (v: string) => void
  onTypeChange: (v: NodeType) => void
  onAdd: () => void
}

export function AddNodeDialog({
  open, onClose, newName, newDesc, newType, error,
  onNameChange, onDescChange, onTypeChange, onAdd,
}: AddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Add node</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Type</label>
            <Select value={newType} onValueChange={(v) => onTypeChange(v as NodeType)}>
              <SelectTrigger className="h-9 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phase">Phase</SelectItem>
                <SelectItem value="objective">Objective</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Name</label>
            <Input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onNameChange(e.target.value) }}
              placeholder="e.g. Literature Review"
              className="h-9 text-[14px]"
              autoFocus
            />
            {error && <p className="text-[11px] text-[hsl(var(--error))]">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Description</label>
            <Textarea
              value={newDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onDescChange(e.target.value)}
              placeholder="Optional details"
              className="resize-none h-16 text-[14px]"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onAdd}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean
  onClose: () => void
  newName: string
  newDesc: string
  newType: NodeType
  error: string
  onNameChange: (v: string) => void
  onDescChange: (v: string) => void
  onTypeChange: (v: NodeType) => void
  onSave: () => void
}

export function EditNodeDialog({
  open, onClose, newName, newDesc, newType, error,
  onNameChange, onDescChange, onTypeChange, onSave,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Edit node</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Type</label>
            <Select value={newType} onValueChange={(v) => onTypeChange(v as NodeType)}>
              <SelectTrigger className="h-9 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phase">Phase</SelectItem>
                <SelectItem value="objective">Objective</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Name</label>
            <Input
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
              className="h-9 text-[14px]"
            />
            {error && <p className="text-[11px] text-[hsl(var(--error))]">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[hsl(var(--muted))]">Description</label>
            <Textarea
              value={newDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onDescChange(e.target.value)}
              className="resize-none h-16 text-[14px]"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ open, onClose, onConfirm }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Delete node?</DialogTitle>
        </DialogHeader>
        <p className="text-[14px] text-[hsl(var(--muted))] py-1">
          This will remove the node and all its children.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
