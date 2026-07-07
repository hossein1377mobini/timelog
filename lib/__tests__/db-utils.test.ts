import { describe, it, expect } from "vitest"
import { mapRow, mapRows } from "@/lib/db-utils"

// ── mapRow ──────────────────────────────────────────────────────────────────

describe("mapRow", () => {
  const mapper = (row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
  })

  it("maps the first row when rows exist", () => {
    const rows = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]
    const result = mapRow(rows, mapper)
    expect(result).toEqual({ id: "1", name: "Alice" })
  })

  it("returns null for an empty array", () => {
    const result = mapRow([], mapper)
    expect(result).toBeNull()
  })
})

// ── mapRows ─────────────────────────────────────────────────────────────────

describe("mapRows", () => {
  const mapper = (row: Record<string, unknown>) => ({
    id: row.id as string,
    value: (row.value as number) * 2,
  })

  it("maps all rows", () => {
    const rows = [
      { id: "a", value: 10 },
      { id: "b", value: 20 },
    ]
    const result = mapRows(rows, mapper)
    expect(result).toEqual([
      { id: "a", value: 20 },
      { id: "b", value: 40 },
    ])
  })

  it("returns empty array for empty input", () => {
    expect(mapRows([], (r) => r)).toEqual([])
  })
})
