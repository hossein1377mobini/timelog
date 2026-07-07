import { describe, it, expect } from "vitest"
import {
  GOAL_PRIORITIES,
  GOAL_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  INTERRUPTION_TYPES,
  INTERRUPTION_SEVERITIES,
} from "@/lib/types"

describe("Goal constants", () => {
  it("GOAL_PRIORITIES contains expected values", () => {
    expect(GOAL_PRIORITIES).toEqual(["high", "medium", "low"])
  })

  it("GOAL_STATUSES contains expected values", () => {
    expect(GOAL_STATUSES).toEqual(["active", "paused", "completed", "archived"])
  })
})

describe("Task constants", () => {
  it("TASK_PRIORITIES contains expected values", () => {
    expect(TASK_PRIORITIES).toEqual(["high", "medium", "low"])
  })

  it("TASK_STATUSES contains expected values", () => {
    expect(TASK_STATUSES).toEqual(["pending", "in-progress", "completed"])
  })
})

describe("Interruption constants", () => {
  it("INTERRUPTION_TYPES contains expected values", () => {
    expect(INTERRUPTION_TYPES).toEqual([
      "distraction",
      "external",
      "thought",
      "break",
      "admin",
    ])
  })

  it("INTERRUPTION_SEVERITIES contains expected values", () => {
    expect(INTERRUPTION_SEVERITIES).toEqual(["low", "medium", "high"])
  })
})
