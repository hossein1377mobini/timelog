import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  createInterruption,
  getAllInterruptions,
  getInterruptionsByDateRange,
} from "@/lib/db-interruptions"

/**
 * GET /api/interruptions
 *
 * Query params:
 *   - dateFrom (optional): filter interruptions from this date (ISO date string)
 *   - dateTo   (optional): filter interruptions to this date (ISO date string)
 *   - limit    (optional): pagination limit (default 50)
 *   - offset   (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (dateFrom && dateTo) {
      const interruptions = await getInterruptionsByDateRange(session.sub, dateFrom, dateTo)
      return NextResponse.json({ interruptions })
    }

    const options: { limit?: number; offset?: number } = {}
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const result = await getAllInterruptions(session.sub, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/interruptions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch interruptions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/interruptions
 *
 * Body: Omit<Interruption, "id">
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const newInterruption = await createInterruption(session.sub, body)
    return NextResponse.json(newInterruption, { status: 201 })
  } catch (error) {
    console.error("POST /api/interruptions error:", error)
    return NextResponse.json(
      { error: "Failed to create interruption" },
      { status: 500 }
    )
  }
}
