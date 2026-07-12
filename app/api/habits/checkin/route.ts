import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  checkinHabit,
  uncheckinHabit,
  resetHabitCheckins,
} from "@/lib/db-habits"

/**
 * POST /api/habits/checkin
 *
 * Record a show-up for a habit on a specific date.
 *
 * Body: { habitId: string, date: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    if (!body.habitId || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields: 'habitId' and 'date'" },
        { status: 400 }
      )
    }

    await checkinHabit(session.sub, body.habitId, body.date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/habits/checkin error:", error)
    return NextResponse.json(
      { error: "Failed to record checkin" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/habits/checkin?habitId=&date=
 *
 * Undo a show-up for a habit on a specific date.
 *
 * Query params:
 *   - habitId: the habit ID
 *   - date: the checkin date (YYYY-MM-DD)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get("habitId")
    const date = searchParams.get("date")

    if (!habitId || !date) {
      return NextResponse.json(
        { error: "Missing required query parameters: 'habitId' and 'date'" },
        { status: 400 }
      )
    }

    await uncheckinHabit(session.sub, habitId, date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/habits/checkin error:", error)
    return NextResponse.json(
      { error: "Failed to remove checkin" },
      { status: 500 }
    )
  }
}
