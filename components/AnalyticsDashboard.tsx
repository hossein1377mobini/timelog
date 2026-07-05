"use client";

import React, { useState, useRef } from "react";
import {
  BarChart3,
  Target,
  CalendarDays,
  Download,
  Lightbulb,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAnalyticsData,
  handleExport,
  AnalyticsChartsTab,
  AnalyticsInsightsTab,
  AnalyticsGoalsTab,
  AnalyticsComparisonsTab,
} from "./analytics";

type Section = "charts" | "insights" | "goals" | "comparisons";

export default function AnalyticsDashboard() {
  const [section, setSection] = useState<Section>("charts");
  const chartRef = useRef<HTMLDivElement>(null);
  const data = useAnalyticsData();

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
            onClick={() => handleExport(data, data.interruptions)}
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
          <AnalyticsChartsTab data={data} />
        )}
        {section === "insights" && (
          <AnalyticsInsightsTab data={data} interruptions={data.interruptions} />
        )}
        {section === "goals" && (
          <AnalyticsGoalsTab data={data} />
        )}
        {section === "comparisons" && (
          <AnalyticsComparisonsTab data={data} />
        )}
      </CardContent>
    </Card>
  );
}
