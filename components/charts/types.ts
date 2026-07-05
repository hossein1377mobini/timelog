export interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

export type PieDataPoint = ChartDataPoint;

export type BarDataPoint = ChartDataPoint;

export interface LineDataPoint {
  label: string;
  value: number;
}

export interface ScatterDataPoint {
  x: number;
  y: number;
}

export const COLORS = [
  "#534AB7",
  "#0F6E56",
  "#854F0B",
  "#185FA5",
  "#993C1D",
  "#6B7280",
  "#0891B2",
  "#7C3AED",
] as const;

export const MONTHS = [
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
] as const;
