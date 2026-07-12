"use client";

import React from "react";

interface MoodSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export default function MoodSelector({ rating, onRatingChange }: MoodSelectorProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted))] mb-2">
        Rate Your Day
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className={`text-2xl transition-transform hover:scale-110 ${
              star <= rating ? "opacity-100" : "opacity-30"
            }`}
          >
            {star <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}
