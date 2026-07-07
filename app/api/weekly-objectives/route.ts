import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAllWeeklyObjectives,
  getWeeklyObjectivesByWeek,
  createWeeklyObjective,
  updateWeeklyObjective,
  deleteWeeklyObjective,
} from "@/lib/db-weekly-objectives"

/**
 * GET /api/weekly-objectives
 *
 * Query params:
 *   - weekStart (optional): ISO date string for the Monday of the target week
 *   - limit     (optional): pagination limit (default 100)
 *   - offset    (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get("weekStart")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (weekStart) {
      const objectives = await getWeeklyObjectivesByWeek(session.sub, weekStart)
      return NextResponse.json({ objectives })
    }

    const options: { limit?: number; offset?: number } = {}
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const objectives = await getAllWeeklyObjectives(session.sub, options)
    return NextResponse.json({ objectives })
  } catch (error) {
    console.error("GET /api/weekly-objectives error:", error)
    return NextResponse.json(
      { error: "Failed to fetch weekly objectives" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/weekly-objectives
 *
 * Body: Omit<WeeklyObjective, "id" | "dailyTaskIds" | "createdAt">
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const newObjective = await createWeeklyObjective(session.sub, body)
    return NextResponse.json(newObjective, { status: 201 })
  } catch (error) {
    console.error("POST /api/weekly-objectives error:", error)
    return NextResponse.json(
      { error: "Failed to create weekly objective" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/weekly-objectives
 *
 * Query params:
 *   - id: the objective ID to update
 *
 * Body: Partial fields (any WeeklyObjective fields except id, dailyTaskIds, createdAt)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' query parameter" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updatedObjective = await updateWeeklyObjective(session.sub, id, body)
    return NextResponse.json(updatedObjective)
  } catch (error) {
    console.error("PATCH /api/weekly-objectives error:", error)
    return NextResponse.json(
      { error: "Failed to update weekly objective" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/weekly-objectives
 *
 * Query params:
 *   - id: the objective ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' query parameter" },
        { status: 400 }
      )
    }

    await deleteWeeklyObjective(session.sub, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/weekly-objectives error:", error)
    return NextResponse.json(
      { error: "Failed to delete weekly objective" },
      { status: 500 }
    )
  }
}
