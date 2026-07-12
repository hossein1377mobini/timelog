"use client";

import React from "react";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
}

export default function HabitForm({
  open,
  onClose,
  name,
  onNameChange,
  onSave,
}: HabitFormProps) {
  return (
    <BottomSheet
      open={open}
      onClose={() => {
        onClose();
        onNameChange("");
      }}
      title="Add Habit"
    >
      <div className="space-y-4">
        <div>
          <label className="text-[12px] font-medium text-[hsl(var(--muted))] mb-1.5 block">
            Habit name
          </label>
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onNameChange(e.target.value)
            }
            placeholder="e.g. Meditate, Exercise, Read"
            className="text-[14px]"
            autoFocus
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && onSave()
            }
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onSave}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
