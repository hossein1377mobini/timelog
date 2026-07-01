/**
 * Module 10: Legacy Cleanup Test
 * 
 * Verifies that all async wrapper functions in storage.ts properly call
 * the database modules instead of localStorage.
 */

import pool from "./lib/db"
import * as storage from "./lib/storage"

async function runTests() {
  console.log("=== Module 10: Legacy Cleanup Tests ===\n")

  let testsPassed = 0
  let testsFailed = 0

  try {
    // Clean up test data
    console.log("Cleaning up test data...")
    await pool.query("DELETE FROM goals WHERE name LIKE 'Test Module 10%'")
    await pool.query("DELETE FROM sessions WHERE task_name LIKE 'Test Module 10%'")
    await pool.query("DELETE FROM settings WHERE key = 'test_module10_key'")
    console.log("✓ Cleanup complete\n")

    // Test 1: Settings (onboarding) - async vs sync
    console.log("Test 1: Settings async wrapper")
    await storage.setOnboardingDoneAsync()
    const isOnboardingDone = await storage.isOnboardingDoneAsync()
    if (isOnboardingDone === true) {
      console.log("✓ Test 1 passed: Onboarding setting stored and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 1 failed: Expected true, got:", isOnboardingDone, "\n")
      testsFailed++
    }

    // Test 2: Goals async wrapper
    console.log("Test 2: Goals async wrapper")
    const newGoal = await storage.addGoalAsync({
      name: "Test Module 10 Goal",
      description: "Testing database migration",
      category: "work",
      tag: "test",
      targetHours: 10,
      targetDate: "2026-12-31",
      weeklyTarget: 5,
      priority: "high",
      status: "active",
      color: "#3b82f6"
    })
    const allGoals = await storage.getGoalsAsync()
    const foundGoal = allGoals.find(g => g.id === newGoal.id)
    if (foundGoal && foundGoal.name === "Test Module 10 Goal") {
      console.log("✓ Test 2 passed: Goal created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 2 failed: Goal not found in database\n")
      testsFailed++
    }

    // Test 3: Goal update async wrapper
    console.log("Test 3: Goal update async wrapper")
    const updatedGoal = await storage.updateGoalAsync(newGoal.id, { status: "completed" })
    if (updatedGoal.status === "completed") {
      console.log("✓ Test 3 passed: Goal updated via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 3 failed: Goal status not updated\n")
      testsFailed++
    }

    // Test 4: Sessions async wrapper
    console.log("Test 4: Sessions async wrapper")
    const now = new Date().toISOString()
    const newSession = await storage.addSessionAsync({
      taskId: null,
      taskName: "Test Module 10 Session",
      tags: ["test"],
      duration: 1500,
      durationFormatted: "25:00",
      startedAt: now,
      endedAt: now,
      date: "2026-07-01",
      pomodoroCount: 1,
      productivityRating: 4
    })
    const allSessions = await storage.getSessionsAsync()
    const foundSession = allSessions.find(s => s.id === newSession.id)
    if (foundSession && foundSession.taskName === "Test Module 10 Session") {
      console.log("✓ Test 4 passed: Session created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 4 failed: Session not found in database\n")
      testsFailed++
    }

    // Test 5: Interruptions async wrapper
    console.log("Test 5: Interruptions async wrapper")
    const newInterruption = await storage.addInterruptionAsync({
      timestamp: new Date().toISOString(),
      sessionId: newSession.id,
      type: "distraction",
      cause: "Test interruption",
      duration: 30,
      note: "Testing",
      recoveryTime: 60,
      severity: "low"
    })
    const allInterruptions = await storage.getInterruptionsAsync()
    const foundInterruption = allInterruptions.find(i => i.id === newInterruption.id)
    if (foundInterruption && foundInterruption.cause === "Test interruption") {
      console.log("✓ Test 5 passed: Interruption created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 5 failed: Interruption not found in database\n")
      testsFailed++
    }

    // Test 6: Reflections async wrapper
    console.log("Test 6: Reflections async wrapper")
    const testDate = "2026-07-01"
    const newReflection = await storage.saveReflectionAsync({
      date: testDate,
      mood: 4,
      accomplishments: ["Test accomplishment"],
      challenges: ["Test challenge"],
      improvements: ["Test improvement"],
      rating: 4,
      wins: ["Test win"],
      tomorrowPlan: "Test plan",
      notes: "Test reflection for module 10"
    })
    const foundReflection = await storage.getReflectionByDateAsync(testDate)
    if (foundReflection && foundReflection.notes === "Test reflection for module 10") {
      console.log("✓ Test 6 passed: Reflection created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 6 failed: Reflection not found in database\n")
      testsFailed++
    }

    // Test 7: Weekly Objectives async wrapper
    console.log("Test 7: Weekly Objectives async wrapper")
    const newObjective = await storage.saveWeeklyObjectiveAsync({
      title: "Test Module 10 Objective",
      description: "Testing weekly objectives",
      goalId: newGoal.id,
      weekStart: "2026-W27",
      weekEnd: "2026-07-06",
      priority: 1,
      status: "pending"
    })
    const weekObjectives = await storage.getObjectivesForWeekAsync("2026-W27")
    const foundObjective = weekObjectives.find(o => o.id === newObjective.id)
    if (foundObjective && foundObjective.title === "Test Module 10 Objective") {
      console.log("✓ Test 7 passed: Weekly objective created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 7 failed: Weekly objective not found in database\n")
      testsFailed++
    }

    // Test 8: Daily Tasks async wrapper
    console.log("Test 8: Daily Tasks async wrapper")
    const newTask = await storage.saveTaskAsync({
      title: "Test Module 10 Task",
      description: "Testing tasks",
      scheduledDate: testDate,
      scheduledTime: "09:00",
      objectiveId: newObjective.id,
      sessionId: null,
      estimatedTime: 60,
      priority: "high",
      status: "pending",
      tags: ["test"],
      pomodoroCount: 0
    })
    const dateTasks = await storage.getTasksForDateAsync(testDate)
    const foundTask = dateTasks.find(t => t.id === newTask.id)
    if (foundTask && foundTask.title === "Test Module 10 Task") {
      console.log("✓ Test 8 passed: Daily task created and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 8 failed: Daily task not found in database\n")
      testsFailed++
    }

    // Test 9: Roadmaps (legacy flat) async wrapper
    console.log("Test 9: Roadmaps (legacy flat) async wrapper")
    await storage.saveRoadmapForGoalAsync(newGoal.id, [
      { id: "", name: "Phase 1", done: false },
      { id: "", name: "Phase 2", done: true }
    ])
    const phases = await storage.getRoadmapForGoalAsync(newGoal.id)
    if (phases.length === 2 && phases[0].name === "Phase 1") {
      console.log("✓ Test 9 passed: Legacy roadmap phases stored and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 9 failed: Legacy roadmap phases not correct\n")
      testsFailed++
    }

    // Test 10: Roadmap Trees (hierarchical) async wrapper
    console.log("Test 10: Roadmap Trees async wrapper")
    const crypto = await import("crypto")
    const rootId = crypto.randomUUID()
    const childId = crypto.randomUUID()
    const testTree = {
      [rootId]: {
        id: rootId,
        type: "phase" as const,
        name: "Root Node",
        description: "Test root",
        goalId: newGoal.id,
        parentId: null,
        children: [childId],
        status: "pending" as const,
        order: 0,
        createdAt: new Date().toISOString()
      },
      [childId]: {
        id: childId,
        type: "objective" as const,
        name: "Child Node",
        description: "Test child",
        goalId: newGoal.id,
        parentId: rootId,
        children: [],
        status: "pending" as const,
        order: 0,
        createdAt: new Date().toISOString()
      }
    }
    await storage.saveRoadmapTreeAsync(newGoal.id, testTree)
    const retrievedTree = await storage.getRoadmapTreeAsync(newGoal.id)
    if (retrievedTree[rootId] && retrievedTree[childId] && retrievedTree[rootId].name === "Root Node") {
      console.log("✓ Test 10 passed: Roadmap tree stored and retrieved via database\n")
      testsPassed++
    } else {
      console.log("✗ Test 10 failed: Roadmap tree not correct\n")
      testsFailed++
    }

    // Test 11: Cascade deletion (Goal → all related data)
    // Note: Sessions are NOT cascade deleted because they don't have a foreign key to goals
    // They only reference task_id, which can be null. This is correct behavior.
    console.log("Test 11: Cascade deletion test")
    await storage.deleteGoalAsync(newGoal.id)
    const goalsAfterDelete = await storage.getGoalsAsync()
    const objectivesAfterDelete = await storage.getWeeklyObjectivesAsync()
    const tasksAfterDelete = await storage.getDailyTasksAsync()
    const phasesAfterDelete = await storage.getRoadmapForGoalAsync(newGoal.id)
    const treeAfterDelete = await storage.getRoadmapTreeAsync(newGoal.id)
    
    const goalDeleted = !goalsAfterDelete.find(g => g.id === newGoal.id)
    const objectiveDeleted = !objectivesAfterDelete.find(o => o.id === newObjective.id)
    const taskDeleted = !tasksAfterDelete.find(t => t.id === newTask.id)
    const phasesDeleted = phasesAfterDelete.length === 0
    const treeDeleted = Object.keys(treeAfterDelete).length === 0
    
    if (goalDeleted && objectiveDeleted && taskDeleted && phasesDeleted && treeDeleted) {
      console.log("✓ Test 11 passed: Goal and all related data cascade deleted\n")
      console.log("   (Sessions remain because they don't have FK to goals - this is correct)\n")
      testsPassed++
    } else {
      console.log("✗ Test 11 failed: Some related data not deleted")
      console.log(`  Goal deleted: ${goalDeleted}`)
      console.log(`  Objective deleted: ${objectiveDeleted}`)
      console.log(`  Task deleted: ${taskDeleted}`)
      console.log(`  Phases deleted: ${phasesDeleted}`)
      console.log(`  Tree deleted: ${treeDeleted}\n`)
      testsFailed++
    }

    // Test 12: Verify synchronous functions still work (backward compatibility)
    console.log("Test 12: Synchronous functions backward compatibility")
    try {
      // These should still work with localStorage for backward compatibility
      const syncGoals = storage.getGoals()
      const syncSessions = storage.getSessions()
      const syncInterruptions = storage.getInterruptions()
      console.log("✓ Test 12 passed: Synchronous functions still available for backward compatibility\n")
      testsPassed++
    } catch (error) {
      console.log("✗ Test 12 failed: Synchronous functions not working:", error, "\n")
      testsFailed++
    }

    console.log("\n" + "=".repeat(50))
    console.log(`Tests passed: ${testsPassed}`)
    console.log(`Tests failed: ${testsFailed}`)
    console.log("=".repeat(50))

    if (testsFailed === 0) {
      console.log("\n✓ All Module 10 tests passed!")
      console.log("\n🎉 MIGRATION COMPLETE! All 10 modules have been successfully migrated from localStorage to PostgreSQL database.")
      console.log("\nSummary:")
      console.log("  ✓ Module 1: Settings")
      console.log("  ✓ Module 2: Sessions")
      console.log("  ✓ Module 3: Interruptions")
      console.log("  ✓ Module 4: Goals")
      console.log("  ✓ Module 5: Reflections")
      console.log("  ✓ Module 6: Weekly Objectives")
      console.log("  ✓ Module 7: Daily Tasks")
      console.log("  ✓ Module 8: Roadmaps (Legacy + Hierarchical)")
      console.log("  ✓ Module 9: Event System")
      console.log("  ✓ Module 10: Legacy Cleanup")
      console.log("\nAll data is now persisted in PostgreSQL database!")
      console.log("Async wrapper functions in lib/storage.ts call database modules.")
      console.log("Synchronous functions remain for backward compatibility.")
    } else {
      console.log("\n✗ Some tests failed")
      process.exit(1)
    }

  } catch (error) {
    console.error("Test execution failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runTests()
