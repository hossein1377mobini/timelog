import { NextRequest, NextResponse } from "next/server"
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTasksByDate,
  getTasksByObjective,
} from "@/lib/db-tasks"

/**
 * GET /api/tasks
 *
 * Query params:
 *   - date   (optional): filter tasks by scheduled ISO date string
 *   - limit  (optional): pagination limit (default 100)
 *   - offset (optional): pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const objectiveId = searchParams.get("objectiveId")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (date) {
      const tasks = await getTasksByDate(date)
      return NextResponse.json({ tasks })
    }

    if (objectiveId) {
      const tasks = await getTasksByObjective(objectiveId)
      return NextResponse.json({ tasks })
    }

    const options: { limit?: number; offset?: number } = {}
    if (limit !== null) options.limit = parseInt(limit, 10)
    if (offset !== null) options.offset = parseInt(offset, 10)

    const tasks = await getAllTasks(options)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("GET /api/tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 *
 * Body: Omit<Task, "id" | "checklist" | "createdAt">
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const task = await createTask(body)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("POST /api/tasks error:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks
 *
 * Query params:
 *   - id: the task ID to update
 *
 * Body: Partial fields to update (any Task fields except id, checklist, createdAt)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' query parameter" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updatedTask = await updateTask(id, body)
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("PATCH /api/tasks error:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks
 *
 * Query params:
 *   - id: the task ID to delete
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

    await deleteTask(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/tasks error:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
