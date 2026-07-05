/**
 * Database persistence layer for roadmaps.
 *
 * Supports both legacy flat phases and hierarchical roadmap nodes,
 * using the {@link withDb} / {@link withTransaction} helpers to
 * eliminate connection boilerplate.
 */

import type { Phase, RoadmapNode, RoadmapTree, RoadmapMap } from "@/lib/types"
import { withDb, withTransaction } from "@/lib/db-utils"
import { notifyDatabaseChange } from "@/lib/db-events"

// ── Row mappers ──────────────────────────────────────────────────────────────

function phaseFromRow(row: Record<string, unknown>): Phase {
  return { id: row.id as string, name: row.name as string, done: row.done as boolean }
}

function nodeFromRow(row: Record<string, unknown>): RoadmapNode {
  return {
    id: row.id as string,
    type: row.type as RoadmapNode["type"],
    name: row.name as string,
    description: row.description as string,
    goalId: row.goal_id as string,
    parentId: row.parent_id as string | null,
    children: [],
    status: row.status as RoadmapNode["status"],
    order: row.order_index as number,
    createdAt: row.created_at as string,
  }
}

function populateChildren(tree: RoadmapTree): void {
  Object.values(tree).forEach((node) => {
    if (node.parentId) {
      const parent = tree[node.parentId]
      if (parent) parent.children.push(node.id)
    }
  })
}

async function getNodeChildren(client: import("pg").PoolClient, nodeId: string): Promise<string[]> {
  const { rows } = await client.query(
    "SELECT id FROM roadmap_nodes WHERE parent_id = $1 ORDER BY order_index",
    [nodeId],
  )
  return rows.map((r: Record<string, unknown>) => r.id as string)
}

// =============================================================================
// LEGACY FLAT ROADMAP PHASES
// =============================================================================

/** Get legacy roadmap phases for a specific goal. */
export async function getRoadmapForGoal(goalId: string): Promise<Phase[]> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM roadmap_phases WHERE goal_id = $1 ORDER BY order_index",
      [goalId],
    )
    return rows.map(phaseFromRow)
  })
}

/** Get all legacy roadmaps, paginated. */
export async function getRoadmaps(options?: {
  limit?: number
  offset?: number
}): Promise<{ roadmaps: RoadmapMap; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit ?? 200
    const offset = options?.offset ?? 0

    const { rows: countRows } = await client.query("SELECT COUNT(*) AS count FROM roadmap_phases")
    const total = parseInt(countRows[0].count as string, 10)

    const { rows } = await client.query(
      "SELECT * FROM roadmap_phases ORDER BY goal_id, order_index LIMIT $1 OFFSET $2",
      [limit, offset],
    )

    const roadmapMap: RoadmapMap = {}
    for (const row of rows) {
      const gid = row.goal_id as string
      if (!roadmapMap[gid]) roadmapMap[gid] = []
      roadmapMap[gid].push(phaseFromRow(row))
    }
    return { roadmaps: roadmapMap, total }
  })
}

/** Replace legacy roadmap phases for a goal (delete-all + insert). */
export async function saveRoadmapForGoal(goalId: string, phases: Phase[]): Promise<void> {
  return withTransaction(async (client) => {
    await client.query("DELETE FROM roadmap_phases WHERE goal_id = $1", [goalId])
    for (let i = 0; i < phases.length; i++) {
      await client.query(
        "INSERT INTO roadmap_phases (goal_id, name, done, order_index) VALUES ($1, $2, $3, $4)",
        [goalId, phases[i]!.name, phases[i]!.done, i],
      )
    }
  })
}

/** Delete all legacy roadmap phases for a goal. */
export async function deleteRoadmapForGoal(goalId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM roadmap_phases WHERE goal_id = $1", [goalId])
  })
}

/** Delete ALL legacy roadmap phases (testing / cleanup). */
export async function deleteAllRoadmapPhases(): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM roadmap_phases")
  })
}

// =============================================================================
// HIERARCHICAL ROADMAP NODES
// =============================================================================

/** Get the hierarchical roadmap tree for a goal (flat Record<ID, RoadmapNode>). */
export async function getRoadmapTree(goalId: string): Promise<RoadmapTree> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM roadmap_nodes WHERE goal_id = $1 ORDER BY order_index",
      [goalId],
    )
    const tree: RoadmapTree = {}
    for (const row of rows) tree[row.id as string] = nodeFromRow(row)
    populateChildren(tree)
    return tree
  })
}

/** Get all roadmap trees for all goals, paginated. */
export async function getRoadmapTrees(options?: {
  limit?: number
  offset?: number
}): Promise<{ trees: Record<string, RoadmapTree>; total: number }> {
  return withDb(async (client) => {
    const limit = options?.limit ?? 200
    const offset = options?.offset ?? 0

    const { rows: countRows } = await client.query("SELECT COUNT(*) AS count FROM roadmap_nodes")
    const total = parseInt(countRows[0].count as string, 10)

    const { rows } = await client.query(
      "SELECT * FROM roadmap_nodes ORDER BY goal_id, order_index LIMIT $1 OFFSET $2",
      [limit, offset],
    )

    const treesMap: Record<string, RoadmapTree> = {}
    for (const row of rows) {
      const gid = row.goal_id as string
      if (!treesMap[gid]) treesMap[gid] = {}
      treesMap[gid][row.id as string] = nodeFromRow(row)
    }
    Object.values(treesMap).forEach(populateChildren)
    return { trees: treesMap, total }
  })
}

/** Replace the entire roadmap tree for a goal. */
export async function saveRoadmapTree(goalId: string, tree: RoadmapTree): Promise<void> {
  return withTransaction(async (client) => {
    await client.query("DELETE FROM roadmap_nodes WHERE goal_id = $1", [goalId])
    const nodes = Object.values(tree)
    for (const node of nodes) {
      await client.query(
        `INSERT INTO roadmap_nodes (id, type, name, description, goal_id, parent_id, status, order_index, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [node.id, node.type, node.name, node.description, node.goalId, node.parentId, node.status, node.order, node.createdAt],
      )
    }
  })
}

/** Add a single roadmap node. */
export async function addRoadmapNode(
  goalId: string,
  node: Omit<RoadmapNode, "id" | "createdAt">,
): Promise<RoadmapNode> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO roadmap_nodes (type, name, description, goal_id, parent_id, status, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [node.type, node.name, node.description, goalId, node.parentId, node.status, node.order],
    )
    return nodeFromRow(rows[0])
  })
}

/** Update a roadmap node. */
export async function updateRoadmapNode(
  nodeId: string,
  updates: Partial<Omit<RoadmapNode, "id" | "goalId" | "children" | "createdAt">>,
): Promise<RoadmapNode> {
  return withDb(async (client) => {
    const fieldMap: Record<string, keyof typeof updates> = {
      type: "type",
      name: "name",
      description: "description",
      parent_id: "parentId",
      status: "status",
      order_index: "order",
    }

    const setClauses: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [col, key] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${col} = $${idx++}`)
        values.push(updates[key])
      }
    }
    if (setClauses.length === 0) throw new Error("No updates provided")

    values.push(nodeId)
    const { rows } = await client.query(
      `UPDATE roadmap_nodes SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    )
    if (rows.length === 0) throw new Error(`Roadmap node ${nodeId} not found`)

    const node = nodeFromRow(rows[0])
    node.children = await getNodeChildren(client, nodeId)
    return node
  })
}

/** Delete a node (CASCADE handles descendants). */
export async function deleteRoadmapNode(nodeId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM roadmap_nodes WHERE id = $1", [nodeId])
  })
}

/** Delete the entire roadmap tree for a goal. */
export async function deleteRoadmapTree(goalId: string): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM roadmap_nodes WHERE goal_id = $1", [goalId])
  })
}

/** Delete ALL roadmap nodes (testing / cleanup). */
export async function deleteAllRoadmapNodes(): Promise<void> {
  return withDb(async (client) => {
    await client.query("DELETE FROM roadmap_nodes")
  })
}

/** Get a single roadmap node by ID (with children populated). */
export async function getRoadmapNodeById(nodeId: string): Promise<RoadmapNode | null> {
  return withDb(async (client) => {
    const { rows } = await client.query("SELECT * FROM roadmap_nodes WHERE id = $1", [nodeId])
    if (rows.length === 0) return null
    const node = nodeFromRow(rows[0])
    node.children = await getNodeChildren(client, nodeId)
    return node
  })
}

/** Get roadmap node count for a goal. */
export async function getRoadmapNodeCount(goalId: string): Promise<number> {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "SELECT COUNT(*) AS count FROM roadmap_nodes WHERE goal_id = $1",
      [goalId],
    )
    return parseInt(rows[0].count as string, 10)
  })
}
