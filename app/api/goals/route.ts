import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/db-goals"

/**
 * GET /api/goals
 *
 * Query params:
 *   - status (optional): filter goals by status (active, paused, completed, archived)
 *   - limit  (optional): pagination limit (default 50)
 *   - offset (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    const options: {
      statusFilter?: string
      limit?: number
      offset?: number
    } = {}
    if (statusFilter !== null) options.statusFilter = statusFilter
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const result = await getAllGoals(session.sub, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/goals error:", error)
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/goals
 *
 * Body: Omit<Goal, "id" | "createdAt" | "updatedAt" | "roadmap">
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const newGoal = await createGoal(session.sub, body)
    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error("POST /api/goals error:", error)
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/goals
 *
 * Query params:
 *   - id: the goal ID to update
 *
 * Body: Partial fields to update (any Goal fields except id, createdAt, updatedAt, roadmap)
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
    const updatedGoal = await updateGoal(session.sub, id, body)
    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error("PATCH /api/goals error:", error)
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/goals
 *
 * Query params:
 *   - id: the goal ID to delete
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

    await deleteGoal(session.sub, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/goals error:", error)
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    )
  }
}
