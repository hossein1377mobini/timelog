import React from "react";
import { Flame, Trophy, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData } from "./analyticsDataHooks";

interface Props {
  data: AnalyticsData;
}

export function AnalyticsHabitsTab({ data }: Props) {
  const { habitStats, habits } = data;

  if (!habitStats || habitStats.totalHabits === 0) {
    return (
      <Card className="h-full">
        <CardContent className="py-8 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Flame size={24} className="text-[hsl(var(--muted))] mx-auto" />
            <p className="text-[12px] text-[hsl(var(--muted))]">
              No habits yet. Start tracking in the Habits tab!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Flame size={14} className="text-[hsl(var(--warning))]" />}
          label="Active Habits"
          value={habitStats.activeHabits}
        />
        <StatCard
          icon={<TrendingUp size={14} className="text-[hsl(var(--success))]" />}
          label="Total Check-ins"
          value={habitStats.totalCheckins}
        />
        <StatCard
          icon={<Flame size={14} className="text-[hsl(var(--success))]" />}
          label="Avg Streak"
          value={`${habitStats.avgStreak} days`}
        />
        <StatCard
          icon={<Trophy size={14} className="text-[hsl(var(--primary))]" />}
          label="Longest Streak"
          value={`${habitStats.longestStreak} days`}
        />
      </div>

      {/* Milestone Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] font-medium">Milestone Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MilestoneRow
            label="Habits formed (40+ days)"
            value={habitStats.habitsAt40}
            color="hsl(var(--success))"
          />
          <MilestoneRow
            label="Habits mastered (80+ days)"
            value={habitStats.habitsAt80}
            color="hsl(var(--primary))"
          />
        </CardContent>
      </Card>

      {/* Habit List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] font-medium">All Habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {habits
            .filter((h) => h.status === "active")
            .map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
        </CardContent>
      </Card>

      {/* Heatmap Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
            <Calendar size={12} className="text-[hsl(var(--muted))]" />
            Check-in Heatmap (Last 90 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={habitStats.dailyCheckins} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
        </div>
        <div className="text-[22px] font-semibold text-[hsl(var(--body-strong))]">
          {value}
        </div>
        <div className="text-[10px] font-medium text-[hsl(var(--muted))] uppercase tracking-wider">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[hsl(var(--body-strong))]">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">
          {value}
        </span>
      </div>
    </div>
  );
}

function HabitRow({ habit }: { habit: AnalyticsData["habits"][0] }) {
  const checkins = habit.checkins.length;
  const status = checkins >= 80 ? "mastered" : checkins >= 40 ? "building" : "active";
  const statusLabel = status === "mastered" ? "Mastered" : status === "building" ? "Formed" : "Building";
  const statusColor = status === "mastered" ? "hsl(var(--primary))" : status === "building" ? "hsl(var(--success))" : "hsl(var(--warning))";

  return (
    <div className="flex items-center gap-3 p-2 rounded-[8px] hover:bg-[hsl(var(--canvas-soft))] transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium"
        style={{ backgroundColor: statusColor + "20", color: statusColor }}
      >
        {status === "mastered" ? "★" : status === "building" ? "✓" : checkins}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[hsl(var(--body-strong))] truncate">
          {habit.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: statusColor + "20", color: statusColor }}
          >
            {statusLabel} ({checkins} days)
          </span>
        </div>
      </div>
    </div>
  );
}

function Heatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 89); // 90 days

  const weeks: Date[][] = [];
  let current = new Date(startDate);
  // Adjust to start of week (Monday)
  const dayOfWeek = current.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 0
  current.setDate(current.getDate() + diff);

  while (current <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const maxCount = Math.max(1, ...Object.values(data));

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      <div className="flex gap-1">
        <div className="w-10 text-right pr-2 text-[8px] text-[hsl(var(--muted))] font-medium">
          Mon
        </div>
        {weeks.length > 0 && weeks[0]!.map((d, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-sm flex items-center justify-center text-[7px] text-[hsl(var(--muted))] font-medium"
          >
            {d.getDate()}
          </div>
        ))}
      </div>
      {weeks.map((week, w) => (
        <div key={w} className="flex gap-1">
          <div className="w-10 text-right pr-2 text-[8px] text-[hsl(var(--muted))] font-medium">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][w % 7]}
          </div>
          {week.map((day, i) => {
            const dateStr = day.toISOString().split("T")[0]!;
            const count = data[dateStr] || 0;
            const intensity = count / maxCount;
            let bgColor = "hsl(var(--hairline))";
            if (count > 0) {
              if (intensity < 0.25) bgColor = "hsl(var(--success))/15";
              else if (intensity < 0.5) bgColor = "hsl(var(--success))/30";
              else if (intensity < 0.75) bgColor = "hsl(var(--success))/50";
              else bgColor = "hsl(var(--success))";
            }
            const isToday = dateStr === today.toISOString().split("T")[0];
            return (
              <div
                key={i}
                className="w-5 h-5 rounded-sm transition-colors"
                style={{ backgroundColor: bgColor }}
                title={`${dateStr}: ${count} check-ins`}
              >
                {isToday && (
                  <div className="w-full h-full rounded-sm border-2 border-[hsl(var(--primary))] pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}