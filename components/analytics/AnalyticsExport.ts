import { formatHM } from "@/lib/utils";
import type { AnalyticsData } from "./analyticsDataHooks";
import type { Interruption } from "@/lib/types";

export function handleExport(
  data: AnalyticsData,
  interruptions: Interruption[],
): void {
  const now = new Date();
  const lines = [
    "=== COMPASS ANALYTICS REPORT ===",
    `Generated: ${now.toLocaleDateString()}`,
    "",
    "TIME DISTRIBUTION",
    ...data.sortedTags.map(
      ([t, s]) =>
        `  ${t}: ${Math.round((s / 3600) * 10) / 10}h (${Math.round((s / data.totalSeconds) * 100)}%)`,
    ),
    "",
    "DAILY TREND (Last 14 Days)",
    ...data.lineData.map((d) => `  ${d.label}: ${Math.round((d.value / 3600) * 10) / 10}h`),
    "",
    "INSIGHTS",
    `  Best time: ${data.bestTime}`,
    `  Best day: ${data.bestDay}`,
    `  Avg session: ${formatHM(data.avgSessionSeconds)}`,
    `  Total sessions: ${data.totalSessions}`,
    `  Total tracked: ${formatHM(data.totalSeconds)}`,
    "",
    "GOAL PROGRESS",
    ...data.goalProgress.map(
      (g) => `  ${g.name}: ${g.logged}h / ${g.targetHours}h (${g.pct}%)`,
    ),
    "",
    "MONTHLY TOTALS",
    ...data.monthlyData.map(([m, s]) => `  ${m}: ${Math.round((s / 3600) * 10) / 10}h`),
    "",
    "TASK COMPLETION",
    `  Completed: ${data.totalCompletedTasks}/${data.totalPlannedTasks} (${data.completionPct}%)`,
    `  Avg mood: ${data.avgMood}/5`,
    `  Avg energy: ${data.avgEnergy ? `${Math.round(data.avgEnergy * 10) / 10}/5` : "—"}`,
    "",
    "MOOD TREND",
    ...data.moodTrend.map(
      (d) => `  ${d.label}: mood ${d.mood}, energy ${d.energy}`,
    ),
    "",
    "INTERRUPTIONS",
    ...Object.entries(data.typeCounts).map(([t, c]) => `  ${t}: ${c}`),
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
