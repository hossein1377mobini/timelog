/**
 * Test script for Module 6: Weekly Objectives migration
 * Tests database-backed weekly objectives CRUD operations
 */

import {
  createWeeklyObjective,
  getWeeklyObjectiveById,
  getAllWeeklyObjectives,
  getWeeklyObjectivesByWeek,
  getWeeklyObjectivesByGoal,
  getWeeklyObjectivesByGoalAndWeek,
  updateWeeklyObjective,
  deleteWeeklyObjective,
  deleteAllWeeklyObjectives,
  getWeeklyObjectiveCount,
} from "./lib/db-weekly-objectives"
import { createGoal, deleteAllGoals } from "./lib/db-goals"
import pool from "./lib/db"

async function testModule6() {
  console.log("🧪 Testing Module 6: Weekly Objectives Migration\n")

  try {
    // Cleanup
    await deleteAllWeeklyObjectives()
    await deleteAllGoals()

    // Create test goals first (weekly objectives depend on goals)
    console.log("📋 Setting up test goals...")
    const goal1 = await createGoal({
      name: "Learn TypeScript",
      description: "Master TypeScript for backend development",
      category: "Education",
      tag: "typescript",
      targetHours: 100,
      targetDate: "2026-12-31",
      weeklyTarget: 10,
      priority: "high",
      status: "active",
      color: "#3b82f6",
    })
    
    const goal2 = await createGoal({
      name: "Build SaaS Product",
      description: "Launch MVP by Q4",
      category: "Project",
      tag: "saas",
      targetHours: 200,
      targetDate: "2026-12-31",
      weeklyTarget: 20,
      priority: "high",
      status: "active",
      color: "#10b981",
    })
    console.log(`✓ Created ${goal1.name} and ${goal2.name}\n`)

    // Test 1: Create weekly objectives
    console.log("1️⃣ Testing createWeeklyObjective...")
    const objective1 = await createWeeklyObjective({
      goalId: goal1.id,
      title: "Complete TypeScript Advanced Course",
      description: "Finish modules 5-8 of the advanced TypeScript course",
      priority: 1,
      status: "in-progress",
      weekStart: "2026-06-29",
      weekEnd: "2026-07-05",
    })
    console.log(`✓ Created objective: ${objective1.title}`)
    console.log(`  Status: ${objective1.status}, Priority: ${objective1.priority}\n`)

    const objective2 = await createWeeklyObjective({
      goalId: goal1.id,
      title: "Build Practice Projects",
      description: "Create 3 small TypeScript projects",
      priority: 2,
      status: "pending",
      weekStart: "2026-06-29",
      weekEnd: "2026-07-05",
    })
    console.log(`✓ Created objective: ${objective2.title}\n`)

    const objective3 = await createWeeklyObjective({
      goalId: goal2.id,
      title: "Design Database Schema",
      description: "Plan and document database architecture",
      priority: 1,
      status: "completed",
      weekStart: "2026-06-29",
      weekEnd: "2026-07-05",
    })
    console.log(`✓ Created objective: ${objective3.title}\n`)

    const objective4 = await createWeeklyObjective({
      goalId: goal2.id,
      title: "Set up CI/CD Pipeline",
      description: "Configure automated testing and deployment",
      priority: 2,
      status: "pending",
      weekStart: "2026-07-06",
      weekEnd: "2026-07-12",
    })
    console.log(`✓ Created objective: ${objective4.title}\n`)

    // Test 2: Get objective by ID
    console.log("2️⃣ Testing getWeeklyObjectiveById...")
    const retrieved = await getWeeklyObjectiveById(objective1.id)
    if (!retrieved) {
      throw new Error("Objective not found by ID")
    }
    console.log(`✓ Retrieved: ${retrieved.title}`)
    if (retrieved.status !== "in-progress") {
      throw new Error(`Expected status in-progress, got ${retrieved.status}`)
    }
    console.log("")

    // Test 3: Get all objectives
    console.log("3️⃣ Testing getAllWeeklyObjectives...")
    const all = await getAllWeeklyObjectives()
    console.log(`✓ Retrieved ${all.length} objectives`)
    if (all.length !== 4) {
      throw new Error(`Expected 4 objectives, got ${all.length}`)
    }
    console.log("")

    // Test 4: Get objectives by week
    console.log("4️⃣ Testing getWeeklyObjectivesByWeek...")
    const week1Objectives = await getWeeklyObjectivesByWeek("2026-06-29")
    console.log(`✓ Week 2026-06-29 has ${week1Objectives.length} objectives`)
    if (week1Objectives.length !== 3) {
      throw new Error(`Expected 3 objectives for week 2026-06-29, got ${week1Objectives.length}`)
    }
    
    const week2Objectives = await getWeeklyObjectivesByWeek("2026-07-06")
    console.log(`✓ Week 2026-07-06 has ${week2Objectives.length} objectives`)
    if (week2Objectives.length !== 1) {
      throw new Error(`Expected 1 objective for week 2026-07-06, got ${week2Objectives.length}`)
    }
    console.log("")

    // Test 5: Get objectives by goal
    console.log("5️⃣ Testing getWeeklyObjectivesByGoal...")
    const goal1Objectives = await getWeeklyObjectivesByGoal(goal1.id)
    console.log(`✓ Goal "${goal1.name}" has ${goal1Objectives.length} objectives`)
    if (goal1Objectives.length !== 2) {
      throw new Error(`Expected 2 objectives for goal1, got ${goal1Objectives.length}`)
    }
    
    const goal2Objectives = await getWeeklyObjectivesByGoal(goal2.id)
    console.log(`✓ Goal "${goal2.name}" has ${goal2Objectives.length} objectives`)
    if (goal2Objectives.length !== 2) {
      throw new Error(`Expected 2 objectives for goal2, got ${goal2Objectives.length}`)
    }
    console.log("")

    // Test 6: Get objectives by goal and week
    console.log("6️⃣ Testing getWeeklyObjectivesByGoalAndWeek...")
    const goal1Week1 = await getWeeklyObjectivesByGoalAndWeek(goal1.id, "2026-06-29")
    console.log(`✓ Goal "${goal1.name}" in week 2026-06-29: ${goal1Week1.length} objectives`)
    if (goal1Week1.length !== 2) {
      throw new Error(`Expected 2 objectives, got ${goal1Week1.length}`)
    }
    
    const goal2Week2 = await getWeeklyObjectivesByGoalAndWeek(goal2.id, "2026-07-06")
    console.log(`✓ Goal "${goal2.name}" in week 2026-07-06: ${goal2Week2.length} objectives`)
    if (goal2Week2.length !== 1) {
      throw new Error(`Expected 1 objective, got ${goal2Week2.length}`)
    }
    console.log("")

    // Test 7: Update objective
    console.log("7️⃣ Testing updateWeeklyObjective...")
    const updated = await updateWeeklyObjective(objective2.id, {
      status: "in-progress",
      description: "Create 3 small TypeScript projects - updated description",
    })
    console.log(`✓ Updated objective status to: ${updated.status}`)
    if (updated.status !== "in-progress") {
      throw new Error(`Expected status in-progress, got ${updated.status}`)
    }
    if (!updated.description.includes("updated description")) {
      throw new Error("Description was not updated")
    }
    console.log("")

    // Test 8: Get objective count
    console.log("8️⃣ Testing getWeeklyObjectiveCount...")
    const count = await getWeeklyObjectiveCount()
    console.log(`✓ Objective count: ${count}`)
    if (count !== 4) {
      throw new Error(`Expected count 4, got ${count}`)
    }
    console.log("")

    // Test 9: Delete objective
    console.log("9️⃣ Testing deleteWeeklyObjective...")
    await deleteWeeklyObjective(objective4.id)
    const afterDelete = await getWeeklyObjectiveCount()
    console.log(`✓ After delete, count: ${afterDelete}`)
    if (afterDelete !== 3) {
      throw new Error(`Expected 3 after delete, got ${afterDelete}`)
    }
    console.log("")

    // Test 10: Verify deleted objective is gone
    console.log("🔟 Testing deleted objective retrieval...")
    const deleted = await getWeeklyObjectiveById(objective4.id)
    if (deleted !== null) {
      throw new Error("Deleted objective should be null")
    }
    console.log("✓ Deleted objective correctly returns null\n")

    // Test 11: Verify CASCADE DELETE (delete goal should delete its objectives)
    console.log("1️⃣1️⃣ Testing CASCADE DELETE (goal -> objectives)...")
    const beforeCascade = await getWeeklyObjectivesByGoal(goal1.id)
    console.log(`✓ Before cascade: Goal1 has ${beforeCascade.length} objectives`)
    
    // Import and use deleteGoal
    const { deleteGoal } = await import("./lib/db-goals")
    await deleteGoal(goal1.id)
    
    const afterCascade = await getWeeklyObjectivesByGoal(goal1.id)
    console.log(`✓ After cascade delete: Goal1 has ${afterCascade.length} objectives`)
    if (afterCascade.length !== 0) {
      throw new Error(`Expected 0 objectives after cascade, got ${afterCascade.length}`)
    }
    
    const totalAfterCascade = await getWeeklyObjectiveCount()
    console.log(`✓ Total objectives after cascade: ${totalAfterCascade}`)
    if (totalAfterCascade !== 1) {
      throw new Error(`Expected 1 objective remaining, got ${totalAfterCascade}`)
    }
    console.log("")

    // Cleanup
    console.log("🧹 Cleaning up...")
    await deleteAllWeeklyObjectives()
    await deleteAllGoals()
    const finalCount = await getWeeklyObjectiveCount()
    if (finalCount !== 0) {
      throw new Error(`Expected 0 after cleanup, got ${finalCount}`)
    }
    console.log("✓ Cleanup complete\n")

    console.log("=".repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 6 is working correctly!")
    console.log("=".repeat(60))
    console.log("\n✅ Module 6 (Weekly Objectives) is ready for production!")

  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule6()
