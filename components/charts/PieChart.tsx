import React from "react";
import { getHours } from "../analytics/analyticsDataHooks";
import { PieDataPoint } from "./types";

export function PieChart({
  data,
  size = 180,
}: {
  data: PieDataPoint[];
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
