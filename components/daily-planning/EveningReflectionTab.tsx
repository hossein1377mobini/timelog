"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOODS } from "@/lib/constants";
import { formatTodayLabel } from "./dailyPlanningHelpers";

interface EveningReflectionTabProps {
  accomplishments: string;
  distractions: string;
  rating: number;
  differently: string;
  gratitude: [string, string, string];
  tomorrowFocus: string;
  eveningMood: number;
  newAccomplishment: string;
  newDistraction: string;
  newDifferently: string;
  onSetAccomplishments: (value: string | ((prev: string) => string)) => void;
  onSetDistractions: (value: string | ((prev: string) => string)) => void;
  onSetRating: (value: number) => void;
  onSetDifferently: (value: string | ((prev: string) => string)) => void;
  onSetGratitude: (value: [string, string, string]) => void;
  onSetTomorrowFocus: (value: string) => void;
  onSetEveningMood: (value: number) => void;
  onSetNewAccomplishment: (value: string) => void;
  onSetNewDistraction: (value: string) => void;
  onSetNewDifferently: (value: string) => void;
  onSaveEveningReflection: () => void;
}

/**
 * EveningReflectionTab - Evening reflection interface
 */
export function EveningReflectionTab({
  accomplishments,
  distractions,
  rating,
  differently,
  gratitude,
  tomorrowFocus,
  eveningMood,
  newAccomplishment,
  newDistraction,
  newDifferently,
  onSetAccomplishments,
  onSetDistractions,
  onSetRating,
  onSetDifferently,
  onSetGratitude,
  onSetTomorrowFocus,
  onSetEveningMood,
  onSetNewAccomplishment,
  onSetNewDistraction,
  onSetNewDifferently,
  onSaveEveningReflection,
}: EveningReflectionTabProps) {
  const todayLabel = formatTodayLabel();

  const addAccomplishment = () => {
    const text = newAccomplishment.trim();
    if (!text) return;
    onSetAccomplishments((prev) => (prev ? prev + "\n" + text : text));
    onSetNewAccomplishment("");
  };

  const addDistraction = () => {
    const text = newDistraction.trim();
    if (!text) return;
    onSetDistractions((prev) => (prev ? prev + "\n" + text : text));
    onSetNewDistraction("");
  };

  const addDifferently = () => {
    const text = newDifferently.trim();
    if (!text) return;
    onSetDifferently((prev) => (prev ? prev + "\n" + text : text));
    onSetNewDifferently("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[13px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          🌙 Evening Reflection
        </p>
        <p className="text-[11px] text-[hsl(var(--muted))] mt-0.5">
          {todayLabel}
        </p>
      </div>

      {/* 1. Mood */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            1
          </span>
          How did today go?
        </label>
        <div className="flex gap-2">
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => onSetEveningMood(i)}
              className={`text-[20px] transition-all ${
                eveningMood === i
                  ? "scale-125"
                  : "opacity-40 hover:opacity-70"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Star rating */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            2
          </span>
          Rate your day
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onSetRating(n)}
              className={`text-[18px] transition-all ${
                rating >= n
                  ? "text-[hsl(var(--warning))]"
                  : "text-[hsl(var(--hairline-strong))]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* 3. Accomplishments bullet list */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            3
          </span>
          What did you accomplish today?
        </label>
        <div className="space-y-1">
          {accomplishments
            .split("\n")
            .filter(Boolean)
            .map((line, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 group/acc"
              >
                <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                  •
                </span>
                <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                  {line}
                </span>
                <button
                  onClick={() => {
                    const lines = accomplishments
                      .split("\n")
                      .filter(Boolean);
                    lines.splice(idx, 1);
                    onSetAccomplishments(lines.join("\n"));
                  }}
                  className="opacity-0 group-hover/acc:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input
            value={newAccomplishment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSetNewAccomplishment(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addAccomplishment();
            }}
            placeholder="Add accomplishment..."
            className="h-7 text-[12px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 shrink-0"
            onClick={addAccomplishment}
          >
            <Plus size={11} />
          </Button>
        </div>
      </div>

      {/* 4. Distractions / challenges bullet list */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            4
          </span>
          What challenged you?
        </label>
        <div className="space-y-1">
          {distractions
            .split("\n")
            .filter(Boolean)
            .map((line, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 group/dis"
              >
                <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                  •
                </span>
                <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                  {line}
                </span>
                <button
                  onClick={() => {
                    const lines = distractions
                      .split("\n")
                      .filter(Boolean);
                    lines.splice(idx, 1);
                    onSetDistractions(lines.join("\n"));
                  }}
                  className="opacity-0 group-hover/dis:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input
            value={newDistraction}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSetNewDistraction(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addDistraction();
            }}
            placeholder="Add challenge..."
            className="h-7 text-[12px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 shrink-0"
            onClick={addDistraction}
          >
            <Plus size={11} />
          </Button>
        </div>
      </div>

      {/* 5. What would you do differently — bullet list */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            5
          </span>
          What would you do differently?
        </label>
        <div className="space-y-1">
          {differently
            .split("\n")
            .filter(Boolean)
            .map((line, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 group/dif"
              >
                <span className="text-[hsl(var(--muted))] text-[11px] shrink-0">
                  •
                </span>
                <span className="flex-1 text-[12px] text-[hsl(var(--body-strong))]">
                  {line}
                </span>
                <button
                  onClick={() => {
                    const lines = differently
                      .split("\n")
                      .filter(Boolean);
                    lines.splice(idx, 1);
                    onSetDifferently(lines.join("\n"));
                  }}
                  className="opacity-0 group-hover/dif:opacity-100 text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
        </div>
        <div className="flex gap-2 mt-1">
          <Input
            value={newDifferently}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSetNewDifferently(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addDifferently();
            }}
            placeholder="Add lesson learned..."
            className="h-7 text-[12px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 shrink-0"
            onClick={addDifferently}
          >
            <Plus size={11} />
          </Button>
        </div>
      </div>

      {/* 6. Wins / gratitude */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            6
          </span>
          Any wins to celebrate? 🎉
        </label>
        <div className="space-y-1.5">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[14px] shrink-0">🏆</span>
              <Input
                value={gratitude[i]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...gratitude] as [
                    string,
                    string,
                    string,
                  ];
                  next[i] = e.target.value;
                  onSetGratitude(next);
                }}
                placeholder={`Win ${i + 1}...`}
                className="h-7 text-[12px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7. Tomorrow's focus */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[hsl(var(--body-strong))] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] flex items-center justify-center font-bold">
            7
          </span>
          Plan for tomorrow?
        </label>
        <Input
          value={tomorrowFocus}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSetTomorrowFocus(e.target.value)
          }
          placeholder="What will you focus on tomorrow?"
          className="h-8 text-[12px]"
        />
      </div>

      <Button className="w-full" onClick={onSaveEveningReflection}>
        Save evening reflection
      </Button>
    </div>
  );
}
