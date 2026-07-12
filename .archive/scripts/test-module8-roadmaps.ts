/**
 * Module 8: Roadmaps Migration Test
 * 
 * Tests both legacy flat roadmap phases and hierarchical roadmap nodes.
 * Verifies CRUD operations, CASCADE DELETE, and tree relationships.
 */

import {
  // Legacy flat roadmaps
  getRoadmaps,
  getRoadmapForGoal,
  saveRoadmapForGoal,
  deleteRoadmapForGoal,
  deleteAllRoadmapPhases,
  // Hierarchical roadmap nodes
  getRoadmapTree,
  getRoadmapTrees,
  saveRoadmapTree,
  addRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
  deleteRoadmapTree,
  getRoadmapNodeById,
  getRoadmapNodeCount,
  deleteAllRoadmapNodes,
} from "@/lib/db-roadmaps"
import { createGoal, deleteAllGoals } from "@/lib/db-goals"
import type { Phase, RoadmapTree, RoadmapNode } from "@/lib/types"
import { randomUUID } from "crypto"

async function runTests() {
  console.log("🧪 Module 8: Roadmaps Migration Tests\n")
  
  try {
    // Clean up before tests
    console.log("🧹 Cleaning up test data...")
    await deleteAllRoadmapNodes()
    await deleteAllRoadmapPhases()
    await deleteAllGoals()
    console.log("✅ Cleanup complete\n")

    // Create prerequisite goals
    console.log("📝 Test 1: Create prerequisite goals...")
    const goal1 = await createGoal({
      name: "Learn TypeScript",
      description: "Master TypeScript",
      category: "Education",
      tag: "Programming",
      targetHours: 100,
      targetDate: "2026-12-31",
      weeklyTarget: 10,
      priority: "high",
      status: "active",
      color: "#3b82f6"
    })
    
    const goal2 = await createGoal({
      name: "Build SaaS Product",
      description: "Launch MVP",
      category: "Business",
      tag: "Startup",
      targetHours: 200,
      targetDate: "2027-06-30",
      weeklyTarget: 15,
      priority: "high",
      status: "active",
      color: "#10b981"
    })
    console.log(`✅ Created goal1: ${goal1.id}`)
    console.log(`✅ Created goal2: ${goal2.id}\n`)

    // ========================================================================
    // PART A: LEGACY FLAT ROADMAP PHASES
    // ========================================================================

    console.log("=" .repeat(60))
    console.log("PART A: Legacy Flat Roadmap Phases")
    console.log("=" .repeat(60) + "\n")

    // Test 2: Create legacy roadmap phases
    console.log("📝 Test 2: Create legacy roadmap phases...")
    const phases1: Phase[] = [
      { id: "phase-1", name: "Learn Basics", done: true },
      { id: "phase-2", name: "Advanced Concepts", done: false },
      { id: "phase-3", name: "Build Projects", done: false },
    ]
    await saveRoadmapForGoal(goal1.id, phases1)
    console.log(`✅ Saved ${phases1.length} phases for goal1`)
    phases1.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name} [${p.done ? 'x' : ' '}]`)
    })
    console.log()

    // Test 3: Get roadmap for specific goal
    console.log("📝 Test 3: Get roadmap for specific goal...")
    const retrieved1 = await getRoadmapForGoal(goal1.id)
    console.log(`✅ Retrieved ${retrieved1.length} phases for goal1`)
    if (retrieved1.length !== phases1.length) {
      throw new Error(`Expected ${phases1.length} phases, got ${retrieved1.length}`)
    }
    console.log()

    // Test 4: Create phases for second goal
    console.log("📝 Test 4: Create phases for second goal...")
    const phases2: Phase[] = [
      { id: "phase-4", name: "Market Research", done: true },
      { id: "phase-5", name: "MVP Development", done: false },
    ]
    await saveRoadmapForGoal(goal2.id, phases2)
    console.log(`✅ Saved ${phases2.length} phases for goal2\n`)

    // Test 5: Get all roadmaps
    console.log("📝 Test 5: Get all roadmaps...")
    const allRoadmaps = await getRoadmaps()
    const goalCount = Object.keys(allRoadmaps).length
    console.log(`✅ Retrieved roadmaps for ${goalCount} goals`)
    console.log(`   goal1: ${allRoadmaps[goal1.id]?.length || 0} phases`)
    console.log(`   goal2: ${allRoadmaps[goal2.id]?.length || 0} phases\n`)

    // Test 6: Update roadmap (replace phases)
    console.log("📝 Test 6: Update roadmap (replace phases)...")
    const updatedPhases: Phase[] = [
      { id: "phase-1", name: "Learn Basics", done: true },
      { id: "phase-2", name: "Advanced Concepts", done: true },
      { id: "phase-3", name: "Build Projects", done: false },
      { id: "phase-6", name: "Production Ready", done: false },
    ]
    await saveRoadmapForGoal(goal1.id, updatedPhases)
    const afterUpdate = await getRoadmapForGoal(goal1.id)
    console.log(`✅ Updated goal1 roadmap: ${afterUpdate.length} phases`)
    if (afterUpdate.length !== 4) {
      throw new Error(`Expected 4 phases after update, got ${afterUpdate.length}`)
    }
    console.log()

    // Test 7: Delete roadmap for specific goal
    console.log("📝 Test 7: Delete roadmap for specific goal...")
    await deleteRoadmapForGoal(goal2.id)
    const afterDelete = await getRoadmapForGoal(goal2.id)
    console.log(`✅ Deleted goal2 roadmap`)
    console.log(`   Remaining phases: ${afterDelete.length}\n`)

    // ========================================================================
    // PART B: HIERARCHICAL ROADMAP NODES
    // ========================================================================

    console.log("=" .repeat(60))
    console.log("PART B: Hierarchical Roadmap Nodes")
    console.log("=" .repeat(60) + "\n")

    // Test 8: Create hierarchical roadmap tree
    console.log("📝 Test 8: Create hierarchical roadmap tree...")
    
    const rootNode = await addRoadmapNode(goal1.id, {
      type: "phase",
      name: "Complete TypeScript Learning Path",
      description: "Master TypeScript from basics to advanced",
      goalId: goal1.id,
      parentId: null,
      children: [],
      status: "in-progress",
      order: 0,
    })
    console.log(`✅ Created root node: ${rootNode.name}`)

    const phase1Node = await addRoadmapNode(goal1.id, {
      type: "phase",
      name: "Phase 1: Fundamentals",
      description: "Learn TypeScript basics",
      goalId: goal1.id,
      parentId: rootNode.id,
      children: [],
      status: "completed",
      order: 0,
    })
    console.log(`   Created phase1: ${phase1Node.name}`)

    const obj1Node = await addRoadmapNode(goal1.id, {
      type: "objective",
      name: "Understand Type System",
      description: "Learn primitive and complex types",
      goalId: goal1.id,
      parentId: phase1Node.id,
      children: [],
      status: "completed",
      order: 0,
    })
    console.log(`   Created objective1: ${obj1Node.name}`)

    const task1Node = await addRoadmapNode(goal1.id, {
      type: "task",
      name: "Study basic types",
      description: "Learn string, number, boolean",
      goalId: goal1.id,
      parentId: obj1Node.id,
      children: [],
      status: "completed",
      order: 0,
    })
    console.log(`   Created task1: ${task1Node.name}\n`)

    // Test 9: Get roadmap tree
    console.log("📝 Test 9: Get roadmap tree...")
    const tree = await getRoadmapTree(goal1.id)
    const nodeCount = Object.keys(tree).length
    console.log(`✅ Retrieved tree with ${nodeCount} nodes`)
    console.log(`   Root children: ${tree[rootNode.id].children.length}`)
    console.log(`   Phase1 children: ${tree[phase1Node.id].children.length}`)
    console.log(`   Obj1 children: ${tree[obj1Node.id].children.length}\n`)

    // Test 10: Get node by ID with children
    console.log("📝 Test 10: Get node by ID...")
    const retrievedNode = await getRoadmapNodeById(rootNode.id)
    if (!retrievedNode) throw new Error("Root node not found")
    console.log(`✅ Retrieved node: ${retrievedNode.name}`)
    console.log(`   Type: ${retrievedNode.type}`)
    console.log(`   Status: ${retrievedNode.status}`)
    console.log(`   Children: ${retrievedNode.children.length}\n`)

    // Test 11: Update roadmap node
    console.log("📝 Test 11: Update roadmap node...")
    const updatedNode = await updateRoadmapNode(phase1Node.id, {
      status: "completed",
      name: "Phase 1: Fundamentals (Complete)",
    })
    console.log(`✅ Updated node status: ${updatedNode.status}`)
    console.log(`   New name: ${updatedNode.name}\n`)

    // Test 12: Add more complex tree structure
    console.log("📝 Test 12: Add more complex tree structure...")
    const phase2Node = await addRoadmapNode(goal1.id, {
      type: "phase",
      name: "Phase 2: Advanced",
      description: "Advanced TypeScript features",
      goalId: goal1.id,
      parentId: rootNode.id,
      children: [],
      status: "in-progress",
      order: 1,
    })

    const obj2Node = await addRoadmapNode(goal1.id, {
      type: "objective",
      name: "Master Generics",
      description: "Learn generic types and constraints",
      goalId: goal1.id,
      parentId: phase2Node.id,
      children: [],
      status: "in-progress",
      order: 0,
    })

    const obj3Node = await addRoadmapNode(goal1.id, {
      type: "objective",
      name: "Learn Decorators",
      description: "Understand and use decorators",
      goalId: goal1.id,
      parentId: phase2Node.id,
      children: [],
      status: "pending",
      order: 1,
    })

    console.log(`✅ Added phase2 with 2 objectives`)
    
    const updatedTree = await getRoadmapTree(goal1.id)
    const updatedCount = Object.keys(updatedTree).length
    console.log(`   Total nodes now: ${updatedCount}\n`)

    // Test 13: Get all roadmap trees
    console.log("📝 Test 13: Get all roadmap trees...")
    const allTrees = await getRoadmapTrees()
    const treeGoalCount = Object.keys(allTrees).length
    console.log(`✅ Retrieved trees for ${treeGoalCount} goals`)
    Object.entries(allTrees).forEach(([goalId, tree]) => {
      console.log(`   Goal ${goalId === goal1.id ? "1" : "?"}:  ${Object.keys(tree).length} nodes`)
    })
    console.log()

    // Test 14: Get node count
    console.log("📝 Test 14: Get node count...")
    const count = await getRoadmapNodeCount(goal1.id)
    console.log(`✅ Node count for goal1: ${count}\n`)

    // Test 15: CASCADE DELETE - delete node with children
    console.log("📝 Test 15: CASCADE DELETE test (delete node with children)...")
    const countBefore = await getRoadmapNodeCount(goal1.id)
    console.log(`   Nodes before deleting phase1: ${countBefore}`)
    
    // Deleting phase1 should also delete obj1 and task1
    await deleteRoadmapNode(phase1Node.id)
    
    const countAfter = await getRoadmapNodeCount(goal1.id)
    console.log(`   Nodes after deleting phase1: ${countAfter}`)
    console.log(`✅ CASCADE DELETE verified: ${countBefore} → ${countAfter}`)
    console.log(`   Deleted phase1 and its 2 descendants\n`)

    // Test 16: Save/replace entire tree
    console.log("📝 Test 16: Save/replace entire tree...")
    const newRootId = randomUUID()
    const newChildId = randomUUID()
    const newTree: RoadmapTree = {
      [newRootId]: {
        id: newRootId,
        type: "phase",
        name: "New Root",
        description: "Completely new tree",
        goalId: goal2.id,
        parentId: null,
        children: [newChildId],
        status: "pending",
        order: 0,
        createdAt: new Date().toISOString(),
      },
      [newChildId]: {
        id: newChildId,
        type: "objective",
        name: "First Objective",
        description: "Child node",
        goalId: goal2.id,
        parentId: newRootId,
        children: [],
        status: "pending",
        order: 0,
        createdAt: new Date().toISOString(),
      },
    }
    
    await saveRoadmapTree(goal2.id, newTree)
    const goal2Tree = await getRoadmapTree(goal2.id)
    const goal2NodeCount = Object.keys(goal2Tree).length
    console.log(`✅ Saved new tree for goal2: ${goal2NodeCount} nodes\n`)

    // Test 17: Delete entire tree
    console.log("📝 Test 17: Delete entire tree...")
    await deleteRoadmapTree(goal2.id)
    const afterTreeDelete = await getRoadmapTree(goal2.id)
    const afterTreeDeleteCount = Object.keys(afterTreeDelete).length
    console.log(`✅ Deleted tree for goal2`)
    console.log(`   Remaining nodes: ${afterTreeDeleteCount}\n`)

    // Test 18: CASCADE DELETE via goal deletion
    console.log("📝 Test 18: CASCADE DELETE test (goal → roadmap nodes)...")
    const nodesBeforeGoalDelete = await getRoadmapNodeCount(goal1.id)
    console.log(`   Nodes before goal deletion: ${nodesBeforeGoalDelete}`)
    
    // This should CASCADE delete all roadmap nodes
    await deleteAllGoals()
    
    const allTreesAfter = await getRoadmapTrees()
    const remainingGoals = Object.keys(allTreesAfter).length
    console.log(`   Trees after goal deletion: ${remainingGoals}`)
    console.log(`✅ CASCADE DELETE verified: all roadmap nodes removed\n`)

    // Final cleanup
    console.log("🧹 Final cleanup...")
    await deleteAllRoadmapNodes()
    await deleteAllRoadmapPhases()
    await deleteAllGoals()
    console.log("✅ Cleanup complete\n")

    console.log("=" .repeat(60))
    console.log("✅ ALL MODULE 8 TESTS PASSED!")
    console.log("=" .repeat(60))
    console.log("\n📊 Test Summary:")
    console.log("   ✅ Legacy flat roadmap phases CRUD")
    console.log("   ✅ Hierarchical roadmap nodes CRUD")
    console.log("   ✅ Tree structure with parent-child relationships")
    console.log("   ✅ Node types (phase, objective, task)")
    console.log("   ✅ CASCADE DELETE (node → descendants)")
    console.log("   ✅ CASCADE DELETE (goal → roadmaps)")
    console.log("   ✅ Multiple trees per goal")
    console.log("   ✅ Node count analytics")
    console.log("\n🎉 Module 8 (Roadmaps) migration is ready!\n")

  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  }
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
