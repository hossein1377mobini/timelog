/**
 * Test script for Module 4: Goals migration
 * Tests database-backed goals CRUD operations
 */

import {
  createGoal,
  getGoalById,
  getAllGoals,
  getGoalsByCategory,
  getGoalsByStatus,
  updateGoal,
  deleteGoal,
  getGoalCount,
  getGoalCountByStatus,
  deleteAllGoals,
} from "./lib/db-goals"
import pool from "./lib/db"
import type { Goal } from "./lib/types"

async function testModule4() {
  console.log("🧪 Testing Module 4: Goals Migration\n")

  try {
    // Cleanup
    await deleteAllGoals()

    // Test 1: Create goals
    console.log("1️⃣ Testing createGoal...")
    const goal1 = await createGoal({
      name: "Learn TypeScript",
      description: "Master TypeScript for full-stack development",
      category: "Learning",
      tag: "typescript",
      targetHours: 100,
      targetDate: "2026-12-31",
      weeklyTarget: 10,
      priority: "high",
      status: "active",
      color: "#3B82F6",
    })
    console.log(`✓ Created goal: ${goal1.name}`)
    console.log(`  ID: ${goal1.id}, Priority: ${goal1.priority}, Status: ${goal1.status}\n`)

    const goal2 = await createGoal({
      name: "Build SaaS Product",
      description: "Launch a profitable SaaS business",
      category: "Business",
      tag: "saas",
      targetHours: 200,
      targetDate: "2027-06-30",
      weeklyTarget: 15,
      priority: "high",
      status: "active",
      color: "#10B981",
    })
    console.log(`✓ Created goal: ${goal2.name}\n`)

    const goal3 = await createGoal({
      name: "Get Fit",
      description: "Exercise 5 days a week",
      category: "Health",
      tag: "fitness",
      targetHours: 150,
      targetDate: "2026-12-31",
      weeklyTarget: 5,
      priority: "medium",
      status: "active",
      color: "#F59E0B",
    })
    console.log(`✓ Created goal: ${goal3.name}\n`)

    // Test 2: Get goal by ID
    console.log("2️⃣ Testing getGoalById...")
    const retrieved = await getGoalById(goal1.id)
    if (!retrieved) {
      throw new Error("Goal not found by ID")
    }
    console.log(`✓ Retrieved goal: ${retrieved.name}`)
    if (retrieved.name !== goal1.name) {
      throw new Error(`Name mismatch: expected ${goal1.name}, got ${retrieved.name}`)
    }
    console.log("")

    // Test 3: Get all goals
    console.log("3️⃣ Testing getAllGoals...")
    const allResult = await getAllGoals()
    console.log(`✓ Retrieved ${allResult.goals.length} goals (total: ${allResult.total})`)
    if (allResult.goals.length !== 3) {
      throw new Error(`Expected 3 goals, got ${allResult.goals.length}`)
    }
    console.log("")

    // Test 4: Get goals by category
    console.log("4️⃣ Testing getGoalsByCategory...")
    const learningGoals = await getGoalsByCategory("Learning")
    console.log(`✓ Retrieved ${learningGoals.length} Learning goals`)
    if (learningGoals.length !== 1) {
      throw new Error(`Expected 1 Learning goal, got ${learningGoals.length}`)
    }
    if (learningGoals[0].name !== "Learn TypeScript") {
      throw new Error(`Expected 'Learn TypeScript', got ${learningGoals[0].name}`)
    }
    console.log("")

    // Test 5: Get goals by status
    console.log("5️⃣ Testing getGoalsByStatus...")
    const activeGoals = await getGoalsByStatus("active")
    console.log(`✓ Retrieved ${activeGoals.length} active goals`)
    if (activeGoals.length !== 3) {
      throw new Error(`Expected 3 active goals, got ${activeGoals.length}`)
    }
    console.log("")

    // Test 6: Update goal
    console.log("6️⃣ Testing updateGoal...")
    const updated = await updateGoal(goal1.id, {
      status: "paused",
      priority: "medium",
      description: "Updated: Master TypeScript and React",
    })
    console.log(`✓ Updated goal status to ${updated.status}`)
    if (updated.status !== "paused") {
      throw new Error(`Expected status 'paused', got ${updated.status}`)
    }
    if (updated.priority !== "medium") {
      throw new Error(`Expected priority 'medium', got ${updated.priority}`)
    }
    console.log("")

    // Test 7: Get goal count
    console.log("7️⃣ Testing getGoalCount...")
    const count = await getGoalCount()
    console.log(`✓ Goal count: ${count}`)
    if (count !== 3) {
      throw new Error(`Expected count 3, got ${count}`)
    }
    console.log("")

    // Test 8: Get goal count by status
    console.log("8️⃣ Testing getGoalCountByStatus...")
    const countByStatus = await getGoalCountByStatus()
    console.log(`✓ Goals by status:`)
    console.log(`  - active: ${countByStatus.active || 0}`)
    console.log(`  - paused: ${countByStatus.paused || 0}`)
    if (countByStatus.active !== 2 || countByStatus.paused !== 1) {
      throw new Error(`Status counts incorrect: ${JSON.stringify(countByStatus)}`)
    }
    console.log("")

    // Test 9: Delete goal
    console.log("9️⃣ Testing deleteGoal...")
    await deleteGoal(goal3.id)
    const afterDelete = await getGoalCount()
    console.log(`✓ After delete, count: ${afterDelete}`)
    if (afterDelete !== 2) {
      throw new Error(`Expected 2 after delete, got ${afterDelete}`)
    }
    console.log("")

    // Test 10: Verify deleted goal is gone
    console.log("🔟 Testing deleted goal retrieval...")
    const deleted = await getGoalById(goal3.id)
    if (deleted !== null) {
      throw new Error("Deleted goal should be null")
    }
    console.log("✓ Deleted goal correctly returns null\n")

    // Cleanup
    console.log("🧹 Cleaning up...")
    await deleteAllGoals()
    const finalCount = await getGoalCount()
    if (finalCount !== 0) {
      throw new Error(`Expected 0 after cleanup, got ${finalCount}`)
    }
    console.log("✓ Cleanup complete\n")

    console.log("=".repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 4 is working correctly!")
    console.log("=".repeat(60))
    console.log("\n✅ Module 4 (Goals) is ready for production!")

  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule4()
