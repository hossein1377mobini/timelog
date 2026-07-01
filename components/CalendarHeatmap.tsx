"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessions } from "@/lib/storage";

interface HeatmapDay {
  date: string;
  seconds: number;
}

function computeDays(): HeatmapDay[] {
  const sessions = getSessions();

  const map: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = new Date(s.startedAt).toISOString().split("T")[0];
    map[day] = (map[day] || 0) + s.duration;
  });

  const result: HeatmapDay[] = [];
  for (let i = 179; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push({ date: key, seconds: map[key] || 0 });
  }
  return result;
}

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

export default function CalendarHeatmap() {
  const [days, setDays] = useState<HeatmapDay[]>([]);

  useEffect(() => {
    function onStorage() {
      setDays(computeDays());
    }
    window.addEventListener("compass-storage-update", onStorage);
    onStorage(); // initial load after mount
    return () => window.removeEventListener("compass-storage-update", onStorage);
  }, []);

  function level(seconds: number) {
    const hours = seconds / 3600;

    if (hours === 0) return "bg-[hsl(var(--surface-strong))]";
    if (hours < 1) return "bg-[hsl(var(--timeline-read))]";
    if (hours < 2) return "bg-[hsl(var(--timeline-grep))]";
    if (hours < 4) return "bg-[hsl(var(--primary))]/60";
    return "bg-[hsl(var(--primary))]";
  }

  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = -1;
  days.forEach((day, i) => {
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], index: i });
      lastMonth = m;
    }
  });

  return (
    <Card className="">
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-medium">Consistency</CardTitle>
      </CardHeader>

      <CardContent className="">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 mb-0.5">
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[9px] text-[hsl(var(--muted))]"
                style={{
                  marginLeft:
                    i === 0
                      ? 0
                      : `${ml.index * 5 - (monthLabels[i - 1]?.index || 0) * 5}px`,
                }}
              >
                {ml.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(18,12px)] gap-1">
            {days.map((day) => (
              <div
                key={day.date}
                title={`${day.date} - ${(day.seconds / 3600).toFixed(1)}h`}
                className={`w-3 h-3 rounded-xs transition-colors ${level(day.seconds)}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
