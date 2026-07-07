import { describe, it, expect } from "vitest"
import { toYMD, groupSessionsByDate } from "@/lib/analytics"
import type { Session } from "@/lib/types"

describe("toYMD", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(toYMD(new Date(2026, 6, 7))).toBe("2026-07-07")
  })

  it("pads single digit month/day", () => {
    expect(toYMD(new Date(2026, 0, 1))).toBe("2026-01-01")
  })

  it("handles December", () => {
    expect(toYMD(new Date(2026, 11, 25))).toBe("2026-12-25")
  })
})

describe("groupSessionsByDate", () => {
  const baseSession: Session = {
    id: "s1",
    taskId: null,
    taskName: "Test",
    tags: [],
    duration: 2700,
    durationFormatted: "45m",
    startedAt: "2026-07-07T09:00:00Z",
    endedAt: "2026-07-07T09:45:00Z",
    date: "2026-07-07",
    pomodoroCount: 1,
    productivityRating: null,
  }

  it("groups sessions by date using session.date field", () => {
    const sessions: Session[] = [
      { ...baseSession, id: "s1", date: "2026-07-07" },
      { ...baseSession, id: "s2", date: "2026-07-07" },
      { ...baseSession, id: "s3", date: "2026-07-08" },
    ]
    const grouped = groupSessionsByDate(sessions)
    expect(grouped.size).toBe(2)
    expect(grouped.get("2026-07-07")?.length).toBe(2)
    expect(grouped.get("2026-07-08")?.length).toBe(1)
  })

  it("infers date from startedAt when session.date is missing", () => {
    const sessions: Session[] = [
      {
        ...baseSession,
        id: "s1",
        date: "",
        startedAt: "2026-07-07T09:00:00Z",
      },
    ]
    const grouped = groupSessionsByDate(sessions)
    expect(grouped.size).toBe(1)
    expect(grouped.has("2026-07-07")).toBe(true)
  })

  it("returns empty map for empty input", () => {
    const grouped = groupSessionsByDate([])
    expect(grouped.size).toBe(0)
  })

  it("handles session with non-ISO startedAt gracefully", () => {
    const sessions: Session[] = [
      { ...baseSession, id: "s1", date: "2026-07-09" },
    ]
    const grouped = groupSessionsByDate(sessions)
    expect(grouped.get("2026-07-09")?.length).toBe(1)
  })
})
