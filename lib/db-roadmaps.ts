/**
 * Database persistence layer for roadmaps.
 * 
 * This module provides async functions for both:
 * 1. Legacy flat roadmap phases (roadmap_phases table)
 * 2. Hierarchical roadmap nodes (roadmap_nodes table)
 */

import pool from "@/lib/db"
import type { Phase, RoadmapNode, RoadmapTree, RoadmapMap } from "@/lib/types"
import { notifyDatabaseChange } from "@/lib/db-events"

// ============================================================================
// LEGACY FLAT ROADMAP PHASES
// ============================================================================

/**
 * Get legacy roadmap phases for a specific goal.
 */
export async function getRoadmapForGoal(goalId: string): Promise<Phase[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM roadmap_phases WHERE goal_id = $1 ORDER BY order_index",
      [goalId]
    )
    
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      done: row.done,
    }))
  } finally {
    client.release()
  }
}

/**
 * Get all legacy roadmap phases for all goals.
 * Returns a map: goalId -> Phase[]
 * Supports pagination with limit and offset.
 */
export async function getRoadmaps(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ roadmaps: RoadmapMap; total: number }> {
  const client = await pool.connect()
  try {
    const limit = options?.limit || 200
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM roadmap_phases")
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated roadmap phases
    const result = await client.query(
      "SELECT * FROM roadmap_phases ORDER BY goal_id, order_index LIMIT $1 OFFSET $2",
      [limit, offset]
    )
    
    const roadmapMap: RoadmapMap = {}
    result.rows.forEach((row) => {
      if (!roadmapMap[row.goal_id]) {
        roadmapMap[row.goal_id] = []
      }
      roadmapMap[row.goal_id].push({
        id: row.id,
        name: row.name,
        done: row.done,
      })
    })
    
    return { roadmaps: roadmapMap, total }
  } finally {
    client.release()
  }
}

/**
 * Save/replace legacy roadmap phases for a goal.
 * This removes all existing phases and creates new ones.
 * Note: Uses database-generated UUIDs, ignores phase.id from input.
 */
export async function saveRoadmapForGoal(goalId: string, phases: Phase[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    
    // Delete existing phases
    await client.query("DELETE FROM roadmap_phases WHERE goal_id = $1", [goalId])
    
    // Insert new phases with database-generated UUIDs
    for (let i = 0; i < phases.length; i++) {
      await client.query(
        `INSERT INTO roadmap_phases (goal_id, name, done, order_index)
         VALUES ($1, $2, $3, $4)`,
        [goalId, phases[i].name, phases[i].done, i]
      )
    }
    
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/**
 * Delete all legacy roadmap phases for a goal.
 */
export async function deleteRoadmapForGoal(goalId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM roadmap_phases WHERE goal_id = $1", [goalId])
  } finally {
    client.release()
  }
}

/**
 * Delete all legacy roadmap phases (for testing/cleanup).
 */
export async function deleteAllRoadmapPhases(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM roadmap_phases")
  } finally {
    client.release()
  }
}

// ============================================================================
// HIERARCHICAL ROADMAP NODES
// ============================================================================

/**
 * Get hierarchical roadmap tree for a specific goal.
 * Returns a flat Record<ID, RoadmapNode> structure.
 */
export async function getRoadmapTree(goalId: string): Promise<RoadmapTree> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM roadmap_nodes WHERE goal_id = $1 ORDER BY order_index",
      [goalId]
    )
    
    const tree: RoadmapTree = {}
    result.rows.forEach((row) => {
      tree[row.id] = {
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        goalId: row.goal_id,
        parentId: row.parent_id,
        children: [], // Will be populated below
        status: row.status,
        order: row.order_index,
        createdAt: row.created_at,
      }
    })
    
    // Build children arrays
    Object.values(tree).forEach((node) => {
      if (node.parentId && tree[node.parentId]) {
        tree[node.parentId].children.push(node.id)
      }
    })
    
    return tree
  } finally {
    client.release()
  }
}

/**
 * Get all hierarchical roadmap trees for all goals.
 * Returns a map: goalId -> RoadmapTree
 * Supports pagination with limit and offset.
 */
export async function getRoadmapTrees(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ trees: Record<string, RoadmapTree>; total: number }> {
  const client = await pool.connect()
  try {
    const limit = options?.limit || 200
    const offset = options?.offset || 0
    
    // Get total count
    const countResult = await client.query("SELECT COUNT(*) as count FROM roadmap_nodes")
    const total = parseInt(countResult.rows[0].count, 10)
    
    // Get paginated roadmap nodes
    const result = await client.query(
      "SELECT * FROM roadmap_nodes ORDER BY goal_id, order_index LIMIT $1 OFFSET $2",
      [limit, offset]
    )
    
    const treesMap: Record<string, RoadmapTree> = {}
    
    result.rows.forEach((row) => {
      if (!treesMap[row.goal_id]) {
        treesMap[row.goal_id] = {}
      }
      treesMap[row.goal_id][row.id] = {
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        goalId: row.goal_id,
        parentId: row.parent_id,
        children: [], // Will be populated below
        status: row.status,
        order: row.order_index,
        createdAt: row.created_at,
      }
    })
    
    // Build children arrays for each tree
    Object.values(treesMap).forEach((tree) => {
      Object.values(tree).forEach((node) => {
        if (node.parentId && tree[node.parentId]) {
          tree[node.parentId].children.push(node.id)
        }
      })
    })
    
    return { trees: treesMap, total }
  } finally {
    client.release()
  }
}

/**
 * Save/replace entire roadmap tree for a goal.
 * This removes all existing nodes and creates new ones.
 */
export async function saveRoadmapTree(goalId: string, tree: RoadmapTree): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    
    // Delete existing nodes
    await client.query("DELETE FROM roadmap_nodes WHERE goal_id = $1", [goalId])
    
    // Insert new nodes
    const nodes = Object.values(tree)
    for (const node of nodes) {
      await client.query(
        `INSERT INTO roadmap_nodes (
          id, type, name, description, goal_id, parent_id, status, order_index, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          node.id,
          node.type,
          node.name,
          node.description,
          node.goalId,
          node.parentId,
          node.status,
          node.order,
          node.createdAt,
        ]
      )
    }
    
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

/**
 * Add a single roadmap node.
 * Returns the created node with generated ID.
 */
export async function addRoadmapNode(
  goalId: string,
  node: Omit<RoadmapNode, "id" | "createdAt">
): Promise<RoadmapNode> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO roadmap_nodes (
        type, name, description, goal_id, parent_id, status, order_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        node.type,
        node.name,
        node.description,
        goalId,
        node.parentId,
        node.status,
        node.order,
      ]
    )
    
    const row = result.rows[0]
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      goalId: row.goal_id,
      parentId: row.parent_id,
      children: [], // No children yet
      status: row.status,
      order: row.order_index,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Update a roadmap node.
 */
export async function updateRoadmapNode(
  nodeId: string,
  updates: Partial<Omit<RoadmapNode, "id" | "goalId" | "children" | "createdAt">>
): Promise<RoadmapNode> {
  const client = await pool.connect()
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.type !== undefined) {
      fields.push(`type = $${paramIndex++}`)
      values.push(updates.type)
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.parentId !== undefined) {
      fields.push(`parent_id = $${paramIndex++}`)
      values.push(updates.parentId)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(updates.status)
    }
    if (updates.order !== undefined) {
      fields.push(`order_index = $${paramIndex++}`)
      values.push(updates.order)
    }

    if (fields.length === 0) {
      throw new Error("No updates provided")
    }

    values.push(nodeId)
    const result = await client.query(
      `UPDATE roadmap_nodes SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error(`Roadmap node ${nodeId} not found`)
    }

    const row = result.rows[0]
    
    // Get children IDs
    const childrenResult = await client.query(
      "SELECT id FROM roadmap_nodes WHERE parent_id = $1 ORDER BY order_index",
      [nodeId]
    )

    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      goalId: row.goal_id,
      parentId: row.parent_id,
      children: childrenResult.rows.map((r) => r.id),
      status: row.status,
      order: row.order_index,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Delete a roadmap node and all its descendants (recursive CASCADE).
 */
export async function deleteRoadmapNode(nodeId: string): Promise<void> {
  const client = await pool.connect()
  try {
    // CASCADE DELETE in schema will handle descendants
    await client.query("DELETE FROM roadmap_nodes WHERE id = $1", [nodeId])
  } finally {
    client.release()
  }
}

/**
 * Delete entire roadmap tree for a goal.
 */
export async function deleteRoadmapTree(goalId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM roadmap_nodes WHERE goal_id = $1", [goalId])
  } finally {
    client.release()
  }
}

/**
 * Delete all roadmap nodes (for testing/cleanup).
 */
export async function deleteAllRoadmapNodes(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM roadmap_nodes")
  } finally {
    client.release()
  }
}

/**
 * Get a single roadmap node by ID (with children IDs populated).
 */
export async function getRoadmapNodeById(nodeId: string): Promise<RoadmapNode | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT * FROM roadmap_nodes WHERE id = $1",
      [nodeId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    
    // Get children IDs
    const childrenResult = await client.query(
      "SELECT id FROM roadmap_nodes WHERE parent_id = $1 ORDER BY order_index",
      [nodeId]
    )
    
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      goalId: row.goal_id,
      parentId: row.parent_id,
      children: childrenResult.rows.map((r) => r.id),
      status: row.status,
      order: row.order_index,
      createdAt: row.created_at,
    }
  } finally {
    client.release()
  }
}

/**
 * Get roadmap node count for a goal.
 */
export async function getRoadmapNodeCount(goalId: string): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT COUNT(*) as count FROM roadmap_nodes WHERE goal_id = $1",
      [goalId]
    )
    return parseInt(result.rows[0].count, 10)
  } finally {
    notifyDatabaseChange()
    client.release()
  }
}
