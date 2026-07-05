import { NextRequest, NextResponse } from "next/server"
import {
  getRoadmapForGoal,
  saveRoadmapForGoal,
  getRoadmapTree,
  addRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
} from "@/lib/db-roadmaps"
import type { Phase } from "@/lib/types"

/**
 * GET /api/roadmaps
 *
 * Query params:
 *   - goalId: the goal ID to fetch roadmaps for
 *
 * Returns the legacy flat roadmap phases for a goal.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get("goalId")
    const tree = searchParams.get("tree")

    if (!goalId) {
      return NextResponse.json(
        { error: "Missing 'goalId' query parameter" },
        { status: 400 }
      )
    }

    if (tree === "true") {
      const roadmapTree = await getRoadmapTree(goalId)
      return NextResponse.json({ tree: roadmapTree })
    }

    const phases = await getRoadmapForGoal(goalId)
    return NextResponse.json({ phases })
  } catch (error) {
    console.error("GET /api/roadmaps error:", error)
    return NextResponse.json(
      { error: "Failed to fetch roadmaps" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/roadmaps
 *
 * Used for:
 *   1. Saving flat phases: body = { goalId, phases: Phase[] }
 *   2. Adding a roadmap node: body = { goalId, node: { ... } }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Case 1: Save flat roadmap phases
    if (body.phases) {
      await saveRoadmapForGoal(body.goalId, body.phases as Phase[])
      return NextResponse.json({ success: true })
    }

    // Case 2: Add a roadmap node
    if (body.node) {
      const node = await addRoadmapNode(body.goalId, body.node)
      return NextResponse.json(node, { status: 201 })
    }

    return NextResponse.json(
      { error: "Invalid body: expected 'phases' or 'node'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("POST /api/roadmaps error:", error)
    return NextResponse.json(
      { error: "Failed to save roadmap" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/roadmaps
 *
 * Query params:
 *   - nodeId: the node ID to update
 *
 * Body: Partial fields to update
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get("nodeId")

    if (!nodeId) {
      return NextResponse.json(
        { error: "Missing 'nodeId' query parameter" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const node = await updateRoadmapNode(nodeId, body)
    return NextResponse.json(node)
  } catch (error) {
    console.error("PATCH /api/roadmaps error:", error)
    return NextResponse.json(
      { error: "Failed to update roadmap node" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/roadmaps
 *
 * Query params:
 *   - nodeId: the node ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get("nodeId")

    if (!nodeId) {
      return NextResponse.json(
        { error: "Missing 'nodeId' query parameter" },
        { status: 400 }
      )
    }

    await deleteRoadmapNode(nodeId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/roadmaps error:", error)
    return NextResponse.json(
      { error: "Failed to delete roadmap node" },
      { status: 500 }
    )
  }
}
