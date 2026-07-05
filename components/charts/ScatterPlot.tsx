import React from "react";
import { ScatterDataPoint } from "./types";

export function ScatterPlot({
  data,
  height = 140,
}: {
  data: ScatterDataPoint[];
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
