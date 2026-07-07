import { describe, it, expect } from "vitest"
import { cn, generateId, todayKey, weekStartKey, weekEndKey, formatDuration, formatHM, secondsToHours } from "@/lib/utils"

// ── cn ──────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible")
  })

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles empty/undefined inputs", () => {
    expect(cn()).toBe("")
    expect(cn("", undefined, null)).toBe("")
  })
})

// ── generateId ──────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string")
  })

  it("returns at least 8 chars", () => {
    expect(generateId().length).toBeGreaterThanOrEqual(8)
  })

  it("produces unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ── todayKey ────────────────────────────────────────────────────────────────

describe("todayKey", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns correct date for a known input", () => {
    const d = new Date(2026, 6, 7) // July 7, 2026
    expect(todayKey(d)).toBe("2026-07-07")
  })

  it("pads month and day to 2 digits", () => {
    const d = new Date(2026, 0, 1) // Jan 1, 2026
    expect(todayKey(d)).toBe("2026-01-01")
  })
})

// ── weekStartKey ────────────────────────────────────────────────────────────

describe("weekStartKey", () => {
  it("returns a Monday for a Monday input", () => {
    const mon = new Date(2026, 6, 6) // July 6 2026 is Monday
    expect(weekStartKey(mon)).toBe("2026-07-06")
  })

  it("returns Monday for a mid-week input", () => {
    const wed = new Date(2026, 6, 8) // Wednesday July 8
    // Monday that week is July 6
    expect(weekStartKey(wed)).toBe("2026-07-06")
  })

  it("returns Monday for a Sunday (edge case)", () => {
    const sun = new Date(2026, 6, 12) // Sunday July 12
    // Previous Monday is July 6
    expect(weekStartKey(sun)).toBe("2026-07-06")
  })
})

// ── weekEndKey ──────────────────────────────────────────────────────────────

describe("weekEndKey", () => {
  it("returns the Sunday of the same week as Monday input", () => {
    const mon = new Date(2026, 6, 6)
    expect(weekEndKey(mon)).toBe("2026-07-12")
  })

  it("returns Sunday for a mid-week input", () => {
    const thu = new Date(2026, 6, 9) // Thursday July 9
    expect(weekEndKey(thu)).toBe("2026-07-12")
  })
})

// ── formatDuration ──────────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("formats 0 seconds as 00:00:00", () => {
    expect(formatDuration(0)).toBe("00:00:00")
  })

  it("formats 3723 seconds as 01:02:03", () => {
    expect(formatDuration(3723)).toBe("01:02:03")
  })

  it("formats exactly one hour", () => {
    expect(formatDuration(3600)).toBe("01:00:00")
  })

  it("formats mixed duration correctly", () => {
    expect(formatDuration(3661)).toBe("01:01:01")
  })
})

// ── formatHM ────────────────────────────────────────────────────────────────

describe("formatHM", () => {
  it("returns 0m for zero", () => {
    expect(formatHM(0)).toBe("0m")
  })

  it("returns minutes-only for sub-hour durations", () => {
    expect(formatHM(2700)).toBe("45m")
  })

  it("returns hours and minutes for multi-hour durations", () => {
    expect(formatHM(7200)).toBe("2h 0m")
  })

  it("rounds remaining seconds correctly", () => {
    expect(formatHM(3723)).toBe("1h 2m")
  })

  it("handles edge case at 59 minutes", () => {
    expect(formatHM(3540)).toBe("59m")
  })

  it("handles edge case at 60 minutes", () => {
    expect(formatHM(3600)).toBe("1h 0m")
  })
})

// ── secondsToHours ──────────────────────────────────────────────────────────

describe("secondsToHours", () => {
  it("converts 5400 seconds to 1.5 hours", () => {
    expect(secondsToHours(5400)).toBe(1.5)
  })

  it("returns 0 for 0 seconds", () => {
    expect(secondsToHours(0)).toBe(0)
  })

  it("rounds to 1 decimal place", () => {
    expect(secondsToHours(3660)).toBe(1) // 1.016 → 1.0
  })

  it("handles 3600 (exactly 1 hour)", () => {
    expect(secondsToHours(3600)).toBe(1)
  })
})
