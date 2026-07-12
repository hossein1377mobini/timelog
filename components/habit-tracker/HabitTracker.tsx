"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Plus } from "lucide-react";
import {
  fetchHabits,
  createHabitApi,
  updateHabitStatusApi,
  deleteHabitApi,
  checkinHabitApi,
  uncheckinHabitApi,
  resetHabitCheckinsApi,
} from "@/lib/db-client";
import type { HabitWithCheckins } from "@/lib/db-client";
import { todayKey } from "@/lib/analytics";
import { toast } from "sonner";

import HabitItem from "./HabitItem";
import HabitForm from "./HabitForm";
import { getHabitAccent, renderSequence } from "./HabitCalendar";
import ConfirmDialog from "./ConfirmDialog";

export default function HabitTracker() {
  const [habits, setHabits] = useState<HabitWithCheckins[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [quitConfirmId, setQuitConfirmId] = useState<string | null>(null);
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const today = todayKey();

  async function loadHabits() {
    try {
      const data = await fetchHabits();
      setHabits(
        data.filter((h) => h.status === "active") as HabitWithCheckins[]
      );
    } catch (e) {
      console.error("Failed to load habits:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function handleAddHabit() {
    const name = newHabitName.trim();
    if (!name) return;
    try {
      await createHabitApi(name);
      setNewHabitName("");
      setAddSheetOpen(false);
      await loadHabits();
      toast.success("Habit created!");
    } catch (e) {
      console.error("Failed to create habit:", e);
      toast.error("Failed to create habit");
    }
  }

  async function handleCheckin(habit: HabitWithCheckins) {
    const checkedIn = habit.checkins.includes(today);
    try {
      if (checkedIn) {
        await uncheckinHabitApi(habit.id, today);
      } else {
        await checkinHabitApi(habit.id, today);
      }
      await loadHabits();
    } catch (e) {
      console.error("Failed to toggle checkin:", e);
      toast.error("Failed to update habit");
    }
  }

  async function handleReset(habitId: string) {
    try {
      await resetHabitCheckinsApi(habitId);
      setResetConfirmId(null);
      await loadHabits();
      toast.success("Habit reset!");
    } catch (e) {
      console.error("Failed to reset habit:", e);
      toast.error("Failed to reset habit");
    }
  }

  async function handleQuit(habitId: string) {
    try {
      await updateHabitStatusApi(habitId, "quit");
      setQuitConfirmId(null);
      await loadHabits();
      toast.success("Habit moved to quit");
    } catch (e) {
      console.error("Failed to quit habit:", e);
      toast.error("Failed to quit habit");
    }
  }

  async function handleDelete(habitId: string) {
    try {
      await deleteHabitApi(habitId);
      setDeleteConfirmId(null);
      await loadHabits();
      toast.success("Habit deleted");
    } catch (e) {
      console.error("Failed to delete habit:", e);
      toast.error("Failed to delete habit");
    }
  }

  const activeHabits = habits.filter((h) => h.status === "active");

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[hsl(var(--primary))] border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={activeHabits.length === 0 ? "hidden" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-medium flex items-center gap-2">
              <Flame className="w-4 h-4 text-[hsl(var(--warning))]" />
              Habit Tracker
            </CardTitle>
            <Button
              size="icon"
              className="h-7 w-7"
              onClick={() => setAddSheetOpen(true)}
              aria-label="Add habit"
            >
              <Plus size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-2">
          <div className="space-y-3">
            {activeHabits.map((habit) => {
              const totalDays = habit.checkins.length;
              const checkedInToday = habit.checkins.includes(today);
              const accentClass = getHabitAccent(totalDays);
              const squares = renderSequence(habit, today);

              return (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  today={today}
                  checkedInToday={checkedInToday}
                  totalDays={totalDays}
                  accentClass={accentClass}
                  squares={squares}
                  onCheckin={() => handleCheckin(habit)}
                  onReset={() => setResetConfirmId(habit.id)}
                  onQuit={() => setQuitConfirmId(habit.id)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {activeHabits.length === 0 && !loading && (
        <div
          onClick={() => setAddSheetOpen(true)}
          className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[12px] p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all"
        >
          <Flame size={24} className="text-[hsl(var(--muted))]" />
          <p className="text-[14px] text-[hsl(var(--muted))]">
            Add your first habit
          </p>
        </div>
      )}

      {/* Add Habit BottomSheet */}
      <HabitForm
        open={addSheetOpen}
        onClose={() => {
          setAddSheetOpen(false);
          setNewHabitName("");
        }}
        name={newHabitName}
        onNameChange={setNewHabitName}
        onSave={handleAddHabit}
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={quitConfirmId !== null}
        title="Quit this habit?"
        message="This will hide the habit from your list. You can still view it in history."
        confirmLabel="Quit"
        onCancel={() => setQuitConfirmId(null)}
        onConfirm={() => handleQuit(quitConfirmId!)}
      />
      <ConfirmDialog
        open={resetConfirmId !== null}
        title="Reset habit?"
        message="This will remove all check-ins for this habit. You'll start fresh from day 1."
        confirmLabel="Reset"
        onCancel={() => setResetConfirmId(null)}
        onConfirm={() => handleReset(resetConfirmId!)}
      />
      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete habit?"
        message="This will permanently delete the habit and all its history."
        confirmLabel="Delete"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
      />
    </>
  );
}
