"use client";

import React from "react";

export function getMilestoneDays(): number[] {
  const milestones = [1, 3, 7, 14];
  let day = 28;
  while (day <= 365) {
    milestones.push(day);
    day += 14;
  }
  return milestones;
}

export function getHabitAccent(totalDays: number): string {
  if (totalDays >= 80) return "bg-blue-500/10 border-blue-500/30";
  if (totalDays >= 40) return "bg-green-500/10 border-green-500/30";
  return "";
}

export function renderSequence(
  habit: { id: string; name: string; checkins: string[]; createdAt: string },
  today: string
): React.ReactNode[] {
  const createdDate = new Date(habit.createdAt);
  const todayDate = new Date();
  const totalDaysSinceCreation =
    Math.floor(
      (todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const displayDays = Math.min(totalDaysSinceCreation, 60);
  const startDay = totalDaysSinceCreation - displayDays + 1;
  const checkinSet = new Set(habit.checkins);

  const squares: React.ReactNode[] = [];

  for (let day = startDay; day <= totalDaysSinceCreation; day++) {
    const currentDate = new Date(createdDate);
    currentDate.setDate(createdDate.getDate() + day - 1);
    const dateStr = currentDate.toISOString().split("T")[0]!;

    const isCheckedIn = checkinSet.has(dateStr);
    const isToday = dateStr === today;

    squares.push(
      <div
        key={dateStr}
        className={`w-[14px] h-[14px] rounded-[3px] flex items-center justify-center transition-all ${
          isCheckedIn
            ? "bg-[hsl(var(--success))]"
            : "border border-[hsl(var(--hairline))] bg-transparent"
        } ${
          isToday
            ? "ring-1 ring-[hsl(var(--muted))] ring-offset-1 ring-offset-[hsl(var(--canvas))]"
            : ""
        }`}
        title={`${isCheckedIn ? "✓ " : ""}${dateStr}${isToday ? " (today)" : ""}`}
      />
    );
  }

  return squares;
}
