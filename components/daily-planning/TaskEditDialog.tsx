"use client";

import React from "react";
import { Plus, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Task, ChecklistItem } from "@/lib/types";

interface EditState {
  taskId: string;
  title: string;
  description: string;
  estimatedTime: number;
  scheduledTime: string;
  priority: "high" | "medium" | "low";
  tags: string;
  checklist: ChecklistItem[];
  newChecklistText: string;
}

interface TaskEditDialogProps {
  editState: EditState | null;
  onClose: () => void;
  onSave: () => void;
  onUpdateEditState: (updater: (prev: EditState | null) => EditState | null) => void;
  onAddChecklistItem: () => void;
  onRemoveChecklistItem: (itemId: string) => void;
  onToggleChecklistItem: (itemId: string) => void;
}

/**
 * TaskEditDialog - Dialog for editing task details and checklist
 */
export const TaskEditDialog = React.memo(function TaskEditDialog({
  editState,
  onClose,
  onSave,
  onUpdateEditState,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onToggleChecklistItem,
}: TaskEditDialogProps) {
  return (
    <Dialog open={editState !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[14px]">Edit Task</DialogTitle>
        </DialogHeader>

        {editState && (
          <div className="space-y-3 py-1">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                Title
              </label>
              <Input
                value={editState.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateEditState((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                className="h-8 text-[13px]"
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                Description
              </label>
              <Textarea
                value={editState.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdateEditState((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                className="resize-none h-14 text-[12px]"
                placeholder="Optional details..."
              />
            </div>

            {/* Estimated time + Scheduled time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Estimated (min)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={
                    editState.estimatedTime === 0
                      ? ""
                      : editState.estimatedTime
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateEditState((prev) =>
                      prev
                        ? {
                            ...prev,
                            estimatedTime: parseInt(e.target.value) || 0,
                          }
                        : null
                    )
                  }
                  className="h-8 text-[12px]"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                  Scheduled time
                </label>
                <Input
                  type="time"
                  value={editState.scheduledTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateEditState((prev) =>
                      prev
                        ? { ...prev, scheduledTime: e.target.value }
                        : null
                    )
                  }
                  className="h-8 text-[12px]"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                Priority
              </label>
              <select
                value={editState.priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onUpdateEditState((prev) =>
                    prev
                      ? {
                          ...prev,
                          priority: e.target.value as
                            | "high"
                            | "medium"
                            | "low",
                        }
                      : null
                  )
                }
                className="w-full h-8 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-card))] px-2 text-[12px] text-[hsl(var(--body-strong))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              >
                <option value="high">🔥 High</option>
                <option value="medium">⭐ Medium</option>
                <option value="low">· Low</option>
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                Tags (comma-separated)
              </label>
              <Input
                value={editState.tags}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateEditState((prev) =>
                    prev ? { ...prev, tags: e.target.value } : null
                  )
                }
                className="h-8 text-[12px]"
                placeholder="focus, deep-work, admin..."
              />
            </div>

            {/* Checklist */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[hsl(var(--muted))]">
                Checklist
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {editState.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 group/item"
                  >
                    <button
                      onClick={() => onToggleChecklistItem(item.id)}
                      className={`shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                        item.done
                          ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                          : "border-[hsl(var(--hairline))]"
                      }`}
                    >
                      {item.done && <Check size={8} className="text-white" />}
                    </button>
                    <span
                      className={`flex-1 text-[12px] ${
                        item.done
                          ? "line-through text-[hsl(var(--muted))]"
                          : "text-[hsl(var(--body))]"
                      }`}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => onRemoveChecklistItem(item.id)}
                      className="opacity-0 group-hover/item:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <Input
                  value={editState.newChecklistText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateEditState((prev) =>
                      prev
                        ? { ...prev, newChecklistText: e.target.value }
                        : null
                    )
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && onAddChecklistItem()
                  }
                  placeholder="Add checklist item..."
                  className="h-7 text-[11px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 shrink-0"
                  onClick={onAddChecklistItem}
                >
                  <Plus size={11} />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
