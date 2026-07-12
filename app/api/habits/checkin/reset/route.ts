import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { resetHabitCheckins } from "@/lib/db-habits"

/**
 * POST /api/habits/checkin/reset
 *
 * Reset all checkins for a habit.
 *
 * Body: { habitId: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    if (!body.habitId) {
      return NextResponse.json(
        { error: "Missing required field: 'habitId'" },
        { status: 400 }
      )
    }

    await resetHabitCheckins(session.sub, body.habitId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/habits/checkin/reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset checkins" },
      { status: 500 }
    )
  }
}