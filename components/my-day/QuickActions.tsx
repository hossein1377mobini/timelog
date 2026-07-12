"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Moon, ArrowRight } from "lucide-react";

interface QuickActionsProps {
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  addQuickTask: () => Promise<void>;
  handleEndDay: () => void;
}

export default function QuickActions({
  newTaskTitle,
  setNewTaskTitle,
  addQuickTask,
  handleEndDay,
}: QuickActionsProps) {
  return (
    <>
      {/* Quick add */}
      <div className="flex gap-2 mb-3">
        <Input
          value={newTaskTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addQuickTask()}
          placeholder="Add a task for today..."
          className="h-9 text-[13px] flex-1"
        />
        <Button
          size="sm"
          onClick={addQuickTask}
          className="h-9 px-3 shrink-0"
          disabled={!newTaskTitle.trim()}
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* End This Day button */}
      <div className="pt-2 pb-4">
        <Button
          onClick={handleEndDay}
          className="w-full h-11 text-[14px] font-medium"
          variant="outline"
        >
          <Moon size={16} className="mr-2" />
          End This Day
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </>
  );
}
