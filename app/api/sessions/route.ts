import { NextRequest, NextResponse } from "next/server"
import {
  getAllSessions,
  createSession,
  deleteSession,
  getSessionsByDate,
} from "@/lib/db-sessions"

/**
 * GET /api/sessions
 *
 * Query params:
 *   - date   (optional): filter sessions by ISO date string
 *   - limit  (optional): pagination limit (default 50)
 *   - offset (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (date) {
      const sessions = await getSessionsByDate(date)
      return NextResponse.json({ sessions })
    }

    const options: { limit?: number; offset?: number } = {}
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const result = await getAllSessions(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/sessions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sessions
 *
 * Body: Omit<Session, "id"> (all session fields except the auto-generated id)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const session = await createSession(body)
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("POST /api/sessions error:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sessions
 *
 * Query params:
 *   - id: the session ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' query parameter" },
        { status: 400 }
      )
    }

    await deleteSession(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/sessions error:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
}
