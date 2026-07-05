"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTimer } from "@/lib/hooks/useTimer";

type TimerHook = ReturnType<typeof useTimer>;

interface Props {
  t: TimerHook;
}

export default function TimerTagInput({ t }: Props) {
  return (
    <>
      {/* Tag input — visible when not active */}
      {!t.isActive && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add tag (e.g. deep-work)"
              value={t.newTag}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                t.setNewTag(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") t.handleAddTag();
              }}
              className="h-8 text-[12px]"
            />
            <Button
              variant="outline"
              onClick={t.handleAddTag}
              className="h-8 px-2 shrink-0 text-[12px]"
            >
              Add
            </Button>
          </div>

          {t.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer text-[11px] hover:opacity-70"
                  onClick={() => t.handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Running tags (read-only) */}
      {t.isActive && t.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {t.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
