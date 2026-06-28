"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  Target,
  CalendarDays,
  Download,
  Lightbulb,
  Activity,
  Clock,
  Award,
} from "lucide-react";
import {
  format,
  startOfWeek,
  differenceInDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  subDays,
} from "date-fns";

interface Session {
  id: number;
  taskName: string;
  tags: string[];
  duration: number;
  startedAt: number;
  endedAt: number;
}

interface Goal {
  id: number;
  name: string;
  tag: string;
  targetHours: number;
  deadline: string;
  weeklyTarget: number;
  color: string;
}

interface Interruption {
  id: number;
  type: string;
  note: string;
  timestamp: number;
  duration?: number;
}

interface DailyTask {
  id: number;
  text: string;
  done: boolean;
  fromWeekly?: boolean;
}
interface DailyRecord {
  date: string;
  morning?: {
    oneThing?: string;
    tasks: DailyTask[];
    interruptions?: string;
    mood: number;
    energy: number;
  };
  evening?: {
    accomplishments?: string;
    distractions?: string;
    rating: number;
    mood: number;
    differently?: string;
    tomorrowFocus?: string;
  };
}

const COLORS = [
  "#534AB7",
  "#0F6E56",
  "#854F0B",
  "#185FA5",
  "#993C1D",
  "#6B7280",
  "#0891B2",
  "#7C3AED",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Section = "charts" | "insights" | "goals" | "comparisons";

function formatHM(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function getHours(secs: number) {
  return Math.round((secs / 3600) * 10) / 10;
}

function PieChart({
  data,
  size = 180,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.38;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {
        data.reduce<{ els: React.ReactNode[]; acc: number }>(
          (state, d, i) => {
            const pct = d.value / total;
            const angle = pct * 360;
            const start = (state.acc / total) * 360;
            const startRad = ((start - 90) * Math.PI) / 180;
            const endRad = ((start + angle - 90) * Math.PI) / 180;
            const newAcc = state.acc + d.value;
            const el =
              pct === 0
                ? null
                : (() => {
                    const x1 = cx + r * Math.cos(startRad),
                      y1 = cy + r * Math.sin(startRad);
                    const x2 = cx + r * Math.cos(endRad),
                      y2 = cy + r * Math.sin(endRad);
                    const large = angle > 180 ? 1 : 0;
                    return (
                      <path
                        key={i}
                        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                        fill={d.color}
                        stroke="hsl(var(--canvas))"
                        strokeWidth="1.5"
                      />
                    );
                  })();
            return { els: [...state.els, el], acc: newAcc };
          },
          { els: [], acc: 0 },
        ).els
      }
      <circle cx={cx} cy={cy} r={r * 0.55} fill="hsl(var(--surface-card))" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-[hsl(var(--body-strong))]"
        fontSize="16"
        fontWeight="400"
      >
        {getHours(total)}h
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className="fill-[hsl(var(--muted))]"
        fontSize="10"
      >
        total
      </text>
    </svg>
  );
}

function BarChart({
  data,
  height = 140,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 36;
  return (
    <svg
      width={data.length * (w + 8)}
      height={height}
      className="overflow-visible"
    >
      <line
        x1="0"
        y1={height - 16}
        x2={data.length * (w + 8)}
        y2={height - 16}
        stroke="hsl(var(--hairline))"
      />
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 32);
        return (
          <g key={i}>
            <rect
              x={i * (w + 8) + 4}
              y={height - 16 - barH}
              width={w}
              height={barH}
              rx="3"
              fill={d.color}
              opacity="0.85"
            />
            <text
              x={i * (w + 8) + 4 + w / 2}
              y={height - 2}
              textAnchor="middle"
              className="fill-[hsl(var(--muted))]"
              fontSize="9"
            >
              {d.label}
            </text>
            <text
              x={i * (w + 8) + 4 + w / 2}
              y={height - 18 - barH}
              textAnchor="middle"
              className="fill-[hsl(var(--body-strong))]"
              fontSize="9"
              fontWeight="500"
            >
              {getHours(d.value)}h
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = data.length > 1 ? 360 / (data.length - 1) : 360;
  const pts = data
    .map((d, i) => `${i * w},${height - 16 - (d.value / max) * (height - 32)}`)
    .join(" ");
  return (
    <svg width="360" height={height} className="overflow-visible">
      <line
        x1="0"
        y1={height - 16}
        x2="360"
        y2={height - 16}
        stroke="hsl(var(--hairline))"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = i * w,
          y = height - 16 - (d.value / max) * (height - 32);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
            <text
              x={x}
              y={height - 2}
              textAnchor="middle"
              className="fill-[hsl(var(--muted))]"
              fontSize="8"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterPlot({
  data,
  height = 140,
}: {
  data: { x: number; y: number }[];
  height?: number;
}) {
  const maxX = Math.max(...data.map((d) => d.x), 1);
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const w = 280;
  return (
    <svg width={w} height={height} className="overflow-visible">
      <line
        x1="24"
        y1={height - 16}
        x2={w}
        y2={height - 16}
        stroke="hsl(var(--hairline))"
      />
      <line
        x1="24"
        y1="0"
        x2="24"
        y2={height - 16}
        stroke="hsl(var(--hairline))"
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={24 + (d.x / maxX) * (w - 32)}
          cy={height - 16 - (d.y / maxY) * (height - 24)}
          r="4"
          fill="hsl(var(--primary))"
          opacity="0.5"
        />
      ))}
      <text
        x={w / 2}
        y={height - 2}
        textAnchor="middle"
        className="fill-[hsl(var(--muted))]"
        fontSize="8"
      >
        Mood →
      </text>
      <text
        x="2"
        y={height / 2}
        textAnchor="middle"
        className="fill-[hsl(var(--muted))]"
        fontSize="8"
        transform={`rotate(-90, 2, ${height / 2})`}
      >
        Hours →
      </text>
    </svg>
  );
}

export default function AnalyticsDashboard() {
  const [section, setSection] = useState<Section>("charts");
  function readAll() {
    return {
      sessions: JSON.parse(
        localStorage.getItem("compass_sessions") || "[]",
      ) as Session[],
      goals: JSON.parse(
        localStorage.getItem("compass_goals") || "[]",
      ) as Goal[],
      records: JSON.parse(
        localStorage.getItem("compass_daily_records") || "[]",
      ) as DailyRecord[],
      interruptions: JSON.parse(
        localStorage.getItem("compass_interruptions") || "[]",
      ) as Interruption[],
    };
  }

  const [sessions, setSessions] = useState<Session[]>(() => readAll().sessions);
  const [goals, setGoals] = useState<Goal[]>(() => readAll().goals);
  const [records, setRecords] = useState<DailyRecord[]>(
    () => readAll().records,
  );
  const [interruptions, setInterruptions] = useState<Interruption[]>(
    () => readAll().interruptions,
  );
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onStorage() {
      const d = readAll();
      setSessions(d.sessions);
      setGoals(d.goals);
      setRecords(d.records);
      setInterruptions(d.interruptions);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const now = new Date();

  const tagTotals: Record<string, number> = {};
  sessions.forEach((s) =>
    s.tags.forEach((t) => {
      tagTotals[t] = (tagTotals[t] || 0) + s.duration;
    }),
  );
  const sortedTags = Object.entries(tagTotals).sort((a, b) => b[1] - a[1]);
  const pieData = sortedTags.slice(0, 6).map(([label, value], i) => ({
    label,
    value,
    color: COLORS[i % COLORS.length],
  }));
  if (sortedTags.length > 6) {
    const rest = sortedTags.slice(6).reduce((s, [, v]) => s + v, 0);
    pieData.push({
      label: "Other",
      value: rest,
      color: COLORS[COLORS.length - 1],
    });
  }

  const dailyTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt).toISOString().split("T")[0];
    dailyTotals[d] = (dailyTotals[d] || 0) + s.duration;
  });
  const lineData: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    lineData.push({ label: format(d, "EEE")[0], value: dailyTotals[key] || 0 });
  }

  const barData = sortedTags.slice(0, 8).map(([label, value], i) => ({
    label: label.replace("#", "").slice(0, 5),
    value,
    color: COLORS[i % COLORS.length],
  }));

  const dailyHours: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt).toISOString().split("T")[0];
    dailyHours[d] = (dailyHours[d] || 0) + s.duration;
  });
  const scatterData: { x: number; y: number }[] = [];
  records.forEach((r) => {
    const mood = r.morning?.mood || r.evening?.mood || 0;
    const hours = dailyHours[r.date] ? dailyHours[r.date] / 3600 : 0;
    if (mood > 0) scatterData.push({ x: mood, y: hours });
  });

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((s, x) => s + x.duration, 0);
  const avgSessionSeconds = totalSessions
    ? Math.round(totalSeconds / totalSessions)
    : 0;

  const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  sessions.forEach((s) => {
    const h = new Date(s.startedAt).getHours();
    if (h < 12) timeBuckets.Morning += s.duration;
    else if (h < 17) timeBuckets.Afternoon += s.duration;
    else if (h < 21) timeBuckets.Evening += s.duration;
    else timeBuckets.Night += s.duration;
  });
  const bestTime =
    Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const dayTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = format(new Date(s.startedAt), "EEEE");
    dayTotals[day] = (dayTotals[day] || 0) + s.duration;
  });
  const bestDay =
    Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const typeCounts: Record<string, number> = {};
  interruptions.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });

  let totalPlannedTasks = 0,
    totalCompletedTasks = 0;
  const moodTrend: { label: string; mood: number; energy: number }[] = [];
  records
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .forEach((r) => {
      if (r.morning) {
        if (r.morning.tasks) {
          totalPlannedTasks += r.morning.tasks.length;
          totalCompletedTasks += r.morning.tasks.filter((t) => t.done).length;
        }
        if (r.morning.mood) {
          moodTrend.push({
            label: format(new Date(r.date), "d/M"),
            mood: r.morning.mood,
            energy: r.morning.energy || 0,
          });
        }
      }
      if (r.evening?.mood) {
        const existing = moodTrend.find(
          (m) => m.label === format(new Date(r.date), "d/M"),
        );
        if (existing)
          existing.mood = Math.round((existing.mood + r.evening.mood) / 2);
        else
          moodTrend.push({
            label: format(new Date(r.date), "d/M"),
            mood: r.evening.mood,
            energy: 0,
          });
      }
    });
  const completionPct = totalPlannedTasks
    ? Math.round((totalCompletedTasks / totalPlannedTasks) * 100)
    : 0;
  const avgMood = moodTrend.length
    ? Math.round(
        (moodTrend.reduce((s, m) => s + m.mood, 0) / moodTrend.length) * 10,
      ) / 10
    : 0;
  const avgEnergy =
    records
      .filter((r) => r.morning?.energy)
      .reduce((s, r) => s + (r.morning?.energy || 0), 0) /
    Math.max(1, records.filter((r) => r.morning?.energy).length);

  const goalProgress = goals.map((g) => {
    const secs = sessions
      .filter((s) =>
        s.tags.map((t) => t.toLowerCase()).includes(g.tag.toLowerCase()),
      )
      .reduce((sum, s) => sum + s.duration, 0);
    return {
      ...g,
      logged: secs / 3600,
      pct: Math.min(100, Math.round((secs / 3600 / g.targetHours) * 100)),
    };
  });

  const monthlyTotals: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.startedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + s.duration;
  });
  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  function handleExport() {
    const lines = [
      "=== COMPASS ANALYTICS REPORT ===",
      `Generated: ${now.toLocaleDateString()}`,
      "",
      "TIME DISTRIBUTION",
      ...sortedTags.map(
        ([t, s]) =>
          `  ${t}: ${getHours(s)}h (${Math.round((s / totalSeconds) * 100)}%)`,
      ),
      "",
      "DAILY TREND (Last 14 Days)",
      ...lineData.map((d) => `  ${d.label}: ${getHours(d.value)}h`),
      "",
      "INSIGHTS",
      `  Best time: ${bestTime}`,
      `  Best day: ${bestDay}`,
      `  Avg session: ${formatHM(avgSessionSeconds)}`,
      `  Total sessions: ${totalSessions}`,
      `  Total tracked: ${formatHM(totalSeconds)}`,
      "",
      "GOAL PROGRESS",
      ...goalProgress.map(
        (g) => `  ${g.name}: ${g.logged}h / ${g.targetHours}h (${g.pct}%)`,
      ),
      "",
      "MONTHLY TOTALS",
      ...monthlyData.map(([m, s]) => `  ${m}: ${getHours(s)}h`),
      "",
      "TASK COMPLETION",
      `  Completed: ${totalCompletedTasks}/${totalPlannedTasks} (${completionPct}%)`,
      `  Avg mood: ${avgMood}/5`,
      `  Avg energy: ${avgEnergy ? `${Math.round(avgEnergy * 10) / 10}/5` : "—"}`,
      "",
      "MOOD TREND",
      ...moodTrend.map(
        (d) => `  ${d.label}: mood ${d.mood}, energy ${d.energy}`,
      ),
      "",
      "INTERRUPTIONS",
      ...Object.entries(typeCounts).map(([t, c]) => `  ${t}: ${c}`),
      interruptions.length > 0
        ? `  Total interruption time: ${Math.round(interruptions.reduce((s, i) => s + (i.duration || 0), 0) / 60)} min`
        : "",
      "---",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compass-analytics-${now.toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "goals", label: "Goals", icon: Target },
    { id: "comparisons", label: "Comparisons", icon: CalendarDays },
  ];

  return (
    <Card className="">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-medium flex items-center gap-1.5">
            <Activity size={14} className="text-[hsl(var(--muted))]" />
            Analytics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-7 text-[12px] gap-1"
          >
            <Download size={11} /> Export
          </Button>
        </div>
        <div className="flex gap-1 mt-2 bg-[hsl(var(--canvas-soft))] rounded-[8px] p-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center justify-center gap-1.5 h-7 rounded-[6px] text-[12px] font-medium flex-1 transition-all ${
                section === s.id
                  ? "bg-[hsl(var(--surface-card))] text-[hsl(var(--body-strong))] shadow-sm"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
              }`}
            >
              <s.icon size={11} /> {s.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent ref={chartRef} className="space-y-4 pt-2">
        {section === "charts" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Time Distribution
                </p>
                <div className="flex justify-center">
                  {pieData.length > 0 ? (
                    <PieChart data={pieData} />
                  ) : (
                    <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                      No tagged sessions yet.
                    </p>
                  )}
                </div>
                {pieData.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {pieData.map((d) => (
                      <span
                        key={d.label}
                        className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted))]"
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ background: d.color }}
                        />
                        {d.label} (
                        {Math.round(
                          (d.value / Math.max(1, totalSeconds)) * 100,
                        )}
                        %)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Daily Trend (14 days)
                </p>
                <div className="flex justify-center">
                  {lineData.some((d) => d.value > 0) ? (
                    <LineChart data={lineData} />
                  ) : (
                    <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                      No sessions yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {moodTrend.length > 1 && (
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Mood & Energy Trend (14 days)
                </p>
                <div className="flex justify-center">
                  <svg width="360" height="100" className="overflow-visible">
                    <line
                      x1="0"
                      y1="84"
                      x2="360"
                      y2="84"
                      stroke="hsl(var(--hairline))"
                    />
                    {moodTrend.map((d, i) => {
                      const x =
                        (i / Math.max(1, moodTrend.length - 1)) * 340 + 10;
                      const moodY = 84 - (d.mood / 5) * 64;
                      const energyY = d.energy
                        ? 84 - (d.energy / 5) * 64
                        : moodY;
                      return (
                        <g key={i}>
                          <text
                            x={x}
                            y="96"
                            textAnchor="middle"
                            className="fill-[hsl(var(--muted))]"
                            fontSize="7"
                          >
                            {d.label}
                          </text>
                          <circle
                            cx={x}
                            cy={moodY}
                            r="3"
                            fill="#534AB7"
                            opacity="0.7"
                          />
                          {d.energy > 0 && (
                            <circle
                              cx={x}
                              cy={energyY}
                              r="3"
                              fill="#0F6E56"
                              opacity="0.7"
                            />
                          )}
                        </g>
                      );
                    })}
                    {moodTrend.slice(1).map((d, i) => {
                      const prev = moodTrend[i];
                      const x1 =
                        (i / Math.max(1, moodTrend.length - 1)) * 340 + 10;
                      const y1 = 84 - (prev.mood / 5) * 64;
                      const x2 =
                        ((i + 1) / Math.max(1, moodTrend.length - 1)) * 340 +
                        10;
                      const y2 = 84 - (d.mood / 5) * 64;
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#534AB7"
                          strokeWidth="1.5"
                          opacity="0.4"
                        />
                      );
                    })}
                    <text
                      x="8"
                      y="10"
                      className="fill-[hsl(var(--muted))]"
                      fontSize="7"
                    >
                      5
                    </text>
                    <text
                      x="8"
                      y="84"
                      className="fill-[hsl(var(--muted))]"
                      fontSize="7"
                    >
                      1
                    </text>
                  </svg>
                </div>
                <div className="flex justify-center gap-4 text-[10px] text-[hsl(var(--muted))]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#534AB7]" /> Mood
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#0F6E56]" />{" "}
                    Energy
                  </span>
                </div>
              </div>
            )}

            <Separator className="" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Tag Comparison
                </p>
                <div className="flex justify-center">
                  {barData.length > 0 ? (
                    <BarChart data={barData} />
                  ) : (
                    <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                      No tags yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Mood vs Productivity
                </p>
                <div className="flex justify-center">
                  {scatterData.length > 1 ? (
                    <ScatterPlot data={scatterData} />
                  ) : (
                    <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                      Need more mood + session data.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {section === "insights" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: Clock,
                label: "Best time",
                value: bestTime,
                sub: "Most productive",
              },
              {
                icon: CalendarDays,
                label: "Best day",
                value: bestDay,
                sub: "Highest total",
              },
              {
                icon: Award,
                label: "Avg session",
                value: formatHM(avgSessionSeconds),
                sub: `${totalSessions} total`,
              },
              {
                icon: Activity,
                label: "Total tracked",
                value: formatHM(totalSeconds),
                sub: "All time",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-3"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon size={11} className="text-[hsl(var(--muted))]" />
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))] font-medium">
                    {m.label}
                  </p>
                </div>
                <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                  {m.value}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted))]">{m.sub}</p>
              </div>
            ))}

            {totalPlannedTasks > 0 && (
              <div className="col-span-2 md:col-span-4 space-y-2 mt-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Task Completion
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                      Completed
                    </p>
                    <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                      {totalCompletedTasks}/{totalPlannedTasks}
                    </p>
                  </div>
                  <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                      Rate
                    </p>
                    <p
                      className={`text-[18px] font-normal ${completionPct >= 70 ? "text-[hsl(var(--success))]" : completionPct >= 40 ? "text-[hsl(var(--timeline-thinking))]" : "text-[hsl(var(--error))]"}`}
                    >
                      {completionPct}%
                    </p>
                  </div>
                  <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                      Avg Mood
                    </p>
                    <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                      {avgMood}/5
                    </p>
                  </div>
                  <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                      Avg Energy
                    </p>
                    <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                      {avgEnergy ? `${Math.round(avgEnergy * 10) / 10}/5` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {interruptions.length > 0 && (
              <div className="col-span-2 md:col-span-4 space-y-2 mt-2">
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Interruption Patterns
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-[12px]"
                      >
                        {type}: {count}
                      </Badge>
                    ))}
                  {interruptions.length > 0 && (
                    <span className="text-[10px] text-[hsl(var(--muted))] self-center">
                      (
                      {Math.round(
                        interruptions.reduce(
                          (s, i) => s + (i.duration || 0),
                          0,
                        ) / 60,
                      )}{" "}
                      min total)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {section === "goals" && (
          <div className="space-y-3">
            {goalProgress.length === 0 ? (
              <p className="text-[14px] text-[hsl(var(--muted))] text-center py-6">
                No goals defined yet.
              </p>
            ) : (
              goalProgress.map((g) => {
                const colorMap: Record<string, string> = {
                  Purple: "#534AB7",
                  Teal: "#0F6E56",
                  Amber: "#854F0B",
                  Blue: "#185FA5",
                  Coral: "#993C1D",
                  Gray: "#6B7280",
                };
                const barColor = colorMap[g.color] || "#534AB7";
                return (
                  <div
                    key={g.id}
                    className="border border-[hsl(var(--hairline))] rounded-[12px] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[hsl(var(--body-strong))]">
                        {g.name}
                      </span>
                      <span className="text-[12px] text-[hsl(var(--muted))]">
                        {g.pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${g.pct}%`, background: barColor }}
                      />
                    </div>
                    <div className="flex gap-3 text-[10px] text-[hsl(var(--muted))]">
                      <span>{g.logged}h logged</span>
                      <span>{g.targetHours}h target</span>
                      <span>
                        {Math.max(
                          0,
                          Math.round((g.targetHours - g.logged) * 10) / 10,
                        )}
                        h remaining
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {section === "comparisons" && (
          <div className="space-y-3">
            {monthlyData.length === 0 ? (
              <p className="text-[14px] text-[hsl(var(--muted))] text-center py-6">
                Not enough data for comparisons yet.
              </p>
            ) : (
              <>
                <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                  Monthly Totals
                </p>
                <div className="space-y-2">
                  {monthlyData.map(([key, secs]) => {
                    const [y, m] = key.split("-");
                    const pct = Math.max(
                      8,
                      (secs / Math.max(...monthlyData.map(([, s]) => s))) * 100,
                    );
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[12px] text-[hsl(var(--muted))] w-16 shrink-0">
                          {MONTHS[parseInt(m) - 1]} {y}
                        </span>
                        <div className="flex-1 h-5 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[hsl(var(--body-strong))]/80 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-medium w-12 text-right text-[hsl(var(--body-strong))]">
                          {getHours(secs)}h
                        </span>
                      </div>
                    );
                  })}
                </div>

                {monthlyData.length >= 2 && (
                  <>
                    <Separator className="" />
                    <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                      Comparison
                    </p>
                    {(() => {
                      const last = monthlyData[monthlyData.length - 1][1];
                      const prev = monthlyData[monthlyData.length - 2][1];
                      const diff = prev
                        ? Math.round(((last - prev) / prev) * 100)
                        : null;
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                              Current month
                            </p>
                            <p className="text-[18px] font-normal text-[hsl(var(--body-strong))]">
                              {getHours(last)}h
                            </p>
                          </div>
                          <div className="bg-[hsl(var(--canvas-soft))] rounded-[8px] px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-[0.08em] text-[hsl(var(--muted))]">
                              vs Previous
                            </p>
                            <p
                              className={`text-[18px] font-normal ${diff && diff > 0 ? "text-[hsl(var(--success))]" : diff && diff < 0 ? "text-[hsl(var(--error))]" : "text-[hsl(var(--body-strong))]"}`}
                            >
                              {diff !== null
                                ? `${diff >= 0 ? "+" : ""}${diff}%`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
