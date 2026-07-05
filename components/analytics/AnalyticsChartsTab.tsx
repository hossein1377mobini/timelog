import React from "react";
import { PieChart, BarChart, LineChart, ScatterPlot } from "../charts";
import { Separator } from "@/components/ui/separator";
import type { AnalyticsData } from "./analyticsDataHooks";

interface Props {
  data: AnalyticsData;
}

export function AnalyticsChartsTab({ data }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
            Time Distribution
          </p>
          <div className="flex justify-center">
            {data.pieData.length > 0 ? (
              <PieChart data={data.pieData} />
            ) : (
              <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                No tagged sessions yet.
              </p>
            )}
          </div>
          {data.pieData.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {data.pieData.map((d) => (
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
                    (d.value / Math.max(1, data.totalSeconds)) * 100,
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
            {data.lineData.some((d) => d.value > 0) ? (
              <LineChart data={data.lineData} />
            ) : (
              <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                No sessions yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {data.moodTrend.length > 1 && (
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
              {data.moodTrend.map((d, i) => {
                const x =
                  (i / Math.max(1, data.moodTrend.length - 1)) * 340 + 10;
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
              {data.moodTrend.slice(1).map((d, i) => {
                const prev = data.moodTrend[i];
                if (!prev) return null;
                const x1 =
                  (i / Math.max(1, data.moodTrend.length - 1)) * 340 + 10;
                const y1 = 84 - (prev.mood / 5) * 64;
                const x2 =
                  ((i + 1) / Math.max(1, data.moodTrend.length - 1)) * 340 +
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
            {data.barData.length > 0 ? (
              <BarChart data={data.barData} />
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
            {data.scatterData.length > 1 ? (
              <ScatterPlot data={data.scatterData} />
            ) : (
              <p className="text-[12px] text-[hsl(var(--muted))] py-8">
                Need more mood + session data.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
