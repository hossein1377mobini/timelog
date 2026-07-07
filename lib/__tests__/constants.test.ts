import { describe, it, expect } from "vitest"
import {
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY,
  DAYS_PER_WEEK,
  DEFAULT_POMODORO_DURATION,
  MIN_PRODUCTIVE_SESSION_DURATION,
  POMODORO_PRESETS,
} from "@/lib/constants/time"

describe("time constants", () => {
  it("basic time units are correct", () => {
    expect(SECONDS_PER_MINUTE).toBe(60)
    expect(SECONDS_PER_HOUR).toBe(3600)
    expect(MINUTES_PER_HOUR).toBe(60)
    expect(HOURS_PER_DAY).toBe(24)
    expect(DAYS_PER_WEEK).toBe(7)
  })

  it("pomodoro defaults are reasonable", () => {
    expect(DEFAULT_POMODORO_DURATION).toBe(25)
    expect(MIN_PRODUCTIVE_SESSION_DURATION).toBe(300)
  })

  it("POMODORO_PRESETS contains all expected presets", () => {
    expect(POMODORO_PRESETS).toHaveLength(6)
    expect(POMODORO_PRESETS[0]).toEqual({ label: "25", work: 25, break: 5 })
    expect(POMODORO_PRESETS[5]).toEqual({ label: "Custom", work: 0, break: 0 })
  })
})
