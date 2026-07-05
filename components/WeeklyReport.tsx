"use client";

import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSessionsDb } from "@/lib/hooks/useDb";
import type { Session } from "@/lib/types";

export default function WeeklyReport() {
  const { data: sessionsData } = useSessionsDb();
  const sessions = sessionsData ?? [];

  const weekSessions = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return sessions.filter((s) => new Date(s.startedAt) >= weekStart);
  }, [sessions]);

  function handleExport() {
    const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);

    const tagSummary = weekSessions.reduce<Record<string, number>>((acc, s) => {
      (s.tags || []).forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + s.duration;
      });
      return acc;
    }, {});

    const lines = [
      "=== COMPASS WEEKLY REPORT ===",
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      "TIME DISTRIBUTION",
      `Total tracked: ${totalHours} hours`,
      "",
      "BY TAG",
      ...Object.entries(tagSummary).map(
        ([tag, secs]) =>
          `  ${tag}: ${(secs / 3600).toFixed(1)}h (${Math.round((secs / totalSeconds) * 100)}%)`,
      ),
      "",
      "SESSIONS",
      ...weekSessions.map(
        (s) =>
          `  ${new Date(s.startedAt).toLocaleString()} - ${s.taskName} (${(s.duration / 60).toFixed(1)} min) ${(s.tags || []).join(" ")}`,
      ),
      "",
      `---`,
      `Total sessions: ${weekSessions.length}`,
      `Average session: ${weekSessions.length ? Math.round(totalSeconds / weekSessions.length / 60) : 0} min`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compass-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalSeconds = weekSessions.reduce((sum, s) => sum + s.duration, 0);

  const tagSummary = weekSessions.reduce<Record<string, number>>((acc, s) => {
    s.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + s.duration;
    });
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Report</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={weekSessions.length === 0}
        >
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {weekSessions.length === 0 ? (
          <p className="text-[14px] text-[hsl(var(--muted))] text-center py-4">
            No sessions this week yet.
          </p>
        ) : (
          <>
            <div className="text-[14px] text-[hsl(var(--muted))]">
              This week:{" "}
              <span className="font-medium text-[hsl(var(--body-strong))]">
                {(totalSeconds / 3600).toFixed(1)}h
              </span>
              {" · "}
              {weekSessions.length} session{weekSessions.length !== 1 ? "s" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagSummary).map(([tag, secs]) => (
                <Badge key={tag} variant="outline" className="text-[12px]">
                  {tag} · {(secs / 3600).toFixed(1)}h
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
