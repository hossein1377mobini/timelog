import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getAllReflections,
  getReflectionByDate,
  upsertReflection,
  deleteReflectionByDate,
} from "@/lib/db-reflections"

/**
 * GET /api/reflections
 *
 * Query params:
 *   - date   (optional): get reflection for a specific ISO date string
 *   - limit  (optional): pagination limit (default 50)
 *   - offset (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (date) {
      const reflection = await getReflectionByDate(session.sub, date)
      return NextResponse.json({ reflection })
    }

    const options: { limit?: number; offset?: number } = {}
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const result = await getAllReflections(session.sub, options)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/reflections error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reflections" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reflections
 *
 * Body: Omit<Reflection, "id" | "createdAt"> (uses upsert — creates or updates by date)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const newReflection = await upsertReflection(session.sub, body)
    return NextResponse.json(newReflection, { status: 201 })
  } catch (error) {
    console.error("POST /api/reflections error:", error)
    return NextResponse.json(
      { error: "Failed to save reflection" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reflections
 *
 * Query params:
 *   - date: the ISO date string of the reflection to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json(
        { error: "Missing 'date' query parameter" },
        { status: 400 }
      )
    }

    await deleteReflectionByDate(session.sub, date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/reflections error:", error)
    return NextResponse.json(
      { error: "Failed to delete reflection" },
      { status: 500 }
    )
  }
}
