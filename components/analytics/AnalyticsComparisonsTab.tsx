import React from "react";
import { Separator } from "@/components/ui/separator";
import { MONTHS } from "../charts/types";
import { getHours, type AnalyticsData } from "./analyticsDataHooks";

interface Props {
  data: AnalyticsData;
}

export function AnalyticsComparisonsTab({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.monthlyData.length === 0 ? (
        <p className="text-[14px] text-[hsl(var(--muted))] text-center py-6">
          Not enough data for comparisons yet.
        </p>
      ) : (
        <>
          <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
            Monthly Totals
          </p>
          <div className="space-y-2">
            {data.monthlyData.map(([key, secs]) => {
              const [y, m] = key.split("-");
              const pct = Math.max(
                8,
                (secs / Math.max(...data.monthlyData.map(([, s]) => s))) * 100,
              );
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[12px] text-[hsl(var(--muted))] w-16 shrink-0">
                    {MONTHS[parseInt(m ?? "0") - 1] ?? "?"} {y}
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

          {data.monthlyData.length >= 2 && (
            <>
              <Separator className="" />
              <p className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Comparison
              </p>
              {(() => {
                const last = data.monthlyData[data.monthlyData.length - 1]![1];
                const prev = data.monthlyData[data.monthlyData.length - 2]![1];
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
  );
}
