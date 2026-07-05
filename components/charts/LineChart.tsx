import React from "react";
import { LineDataPoint } from "./types";

export function LineChart({
  data,
  height = 120,
}: {
  data: LineDataPoint[];
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
