import React from "react";
import { getHours } from "../analytics/analyticsDataHooks";
import { BarDataPoint } from "./types";

export function BarChart({
  data,
  height = 140,
}: {
  data: BarDataPoint[];
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
