import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAllHabits,
  createHabit,
  updateHabitStatus,
  deleteHabit,
  getHabitCheckins,
} from "@/lib/db-habits"

/**
 * GET /api/habits
 *
 * Returns all habits for the authenticated user, each with its checkin dates.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const habits = await getAllHabits(session.sub)

    // Fetch checkins for each habit
    const habitsWithCheckins = await Promise.all(
      habits.map(async (habit) => {
        const checkins = await getHabitCheckins(session.sub, habit.id)
        return { ...habit, checkins }
      })
    )

    return NextResponse.json({ habits: habitsWithCheckins })
  } catch (error) {
    console.error("GET /api/habits error:", error)
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/habits
 *
 * Body: { name: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'name' field" },
        { status: 400 }
      )
    }

    const habit = await createHabit(session.sub, body.name.trim())
    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    console.error("POST /api/habits error:", error)
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/habits?id=
 *
 * Query params:
 *   - id: the habit ID to update
 *
 * Body: { status: "active" | "quit" }
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
    if (!body.status || !["active", "quit"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid or missing 'status' field. Must be 'active' or 'quit'" },
        { status: 400 }
      )
    }

    await updateHabitStatus(session.sub, id, body.status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PATCH /api/habits error:", error)
    return NextResponse.json(
      { error: "Failed to update habit" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/habits?id=
 *
 * Query params:
 *   - id: the habit ID to delete
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

    await deleteHabit(session.sub, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/habits error:", error)
    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    )
  }
}
