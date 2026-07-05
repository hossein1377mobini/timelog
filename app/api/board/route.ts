import { NextResponse } from "next/server"
import { getAllSessions } from "@/lib/db-sessions"
import { getAllGoals } from "@/lib/db-goals"
import { getAllReflections } from "@/lib/db-reflections"
import { getAllTasks } from "@/lib/db-tasks"

/**
 * GET /api/board
 *
 * Aggregates data from multiple tables into a single dashboard response.
 * Each section includes a limited set of recent items for display purposes.
 */
export async function GET() {
  try {
    const [sessionsResult, goalsResult, reflectionsResult, tasks] =
      await Promise.all([
        getAllSessions({ limit: 10, offset: 0 }),
        getAllGoals({ limit: 10, offset: 0 }),
        getAllReflections({ limit: 5, offset: 0 }),
        getAllTasks({ limit: 10, offset: 0 }),
      ])

    return NextResponse.json({
      sessions: sessionsResult.sessions,
      sessionsTotal: sessionsResult.total,
      goals: goalsResult.goals,
      goalsTotal: goalsResult.total,
      reflections: reflectionsResult.reflections,
      reflectionsTotal: reflectionsResult.total,
      tasks,
    })
  } catch (error) {
    console.error("GET /api/board error:", error)
    return NextResponse.json(
      { error: "Failed to fetch board data" },
      { status: 500 }
    )
  }
}
