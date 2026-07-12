"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RatingDialogProps {
  t: any;
}

export default function RatingDialog({ t }: RatingDialogProps) {
  return (
    <Dialog open={t.rateOpen} onOpenChange={t.setRateOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>How did that session go?</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-[13px] text-[hsl(var(--muted))] text-center">
            Rate your productivity for this session
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => t.setRating(star)}
                className={`text-3xl transition-transform hover:scale-110 ${
                  star <= t.rating ? "opacity-100" : "opacity-30"
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
          {t.rating > 0 && (
            <p className="text-center text-[12px] text-[hsl(var(--muted))]">
              {["", "Rough session", "Below average", "Average", "Pretty good!", "Excellent! 🚀"][t.rating]}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => t.setRateOpen(false)}>
            Cancel
          </Button>
          <Button onClick={t.handleRateConfirm}>Save Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
