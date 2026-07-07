import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import {
  getSetting,
  setSetting,
  getAllSettings,
} from "@/lib/db-settings"

/**
 * GET /api/settings
 *
 * Query params:
 *   - key (optional): get a single setting value by key
 *   If no key is provided, returns all settings as a key-value map.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      const value = await getSetting(session.sub, key)
      return NextResponse.json({ key, value })
    }

    const settings = await getAllSettings(session.sub)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("GET /api/settings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings
 *
 * Body: { key: string, value: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()

    if (!body.key || typeof body.key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'key' in request body" },
        { status: 400 }
      )
    }

    if (typeof body.value !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'value' in request body" },
        { status: 400 }
      )
    }

    await setSetting(session.sub, body.key, body.value)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/settings error:", error)
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    )
  }
}
