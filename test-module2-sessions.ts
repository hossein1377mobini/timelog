/**
 * Test script for Module 2: Sessions migration
 * Tests database-backed sessions CRUD operations
 */

import {
  createSession,
  getAllSessions,
  getSessionById,
  getSessionsByDate,
  getSessionsByDateRange,
  deleteSession,
  deleteAllSessions,
  getSessionCount,
  getTotalFocusTime,
} from "./lib/db-sessions"
import pool from "./lib/db"
import type { Session } from "./lib/types"

async function testModule2() {
  console.log("🧪 Testing Module 2: Sessions Migration\n")

  try {
    // Cleanup any existing test data
    await deleteAllSessions()

    // Test 1: Create a session
    console.log("1️⃣ Testing createSession...")
    const session1 = await createSession({
      taskId: null,
      taskName: "Test Focus Session 1",
      tags: ["coding", "testing"],
      duration: 1500, // 25 minutes
      durationFormatted: "25:00",
      startedAt: "2026-07-01T10:00:00Z",
      endedAt: "2026-07-01T10:25:00Z",
      date: "2026-07-01",
      pomodoroCount: 1,
      productivityRating: 4,
    })
    console.log(`✓ Created session with ID: ${session1.id}`)
    console.log(`  Task: ${session1.taskName}`)
    console.log(`  Duration: ${session1.durationFormatted}`)
    console.log(`  Tags: ${session1.tags.join(", ")}\n`)

    // Test 2: Create more sessions
    console.log("2️⃣ Creating additional test sessions...")
    const session2 = await createSession({
      taskId: null,
      taskName: "Test Focus Session 2",
      tags: ["writing", "documentation"],
      duration: 3000, // 50 minutes
      durationFormatted: "50:00",
      startedAt: "2026-07-01T11:00:00Z",
      endedAt: "2026-07-01T11:50:00Z",
      date: "2026-07-01",
      pomodoroCount: 2,
      productivityRating: 5,
    })

    const session3 = await createSession({
      taskId: null,
      taskName: "Test Focus Session 3",
      tags: ["coding", "frontend"],
      duration: 1800, // 30 minutes
      durationFormatted: "30:00",
      startedAt: "2026-07-02T09:00:00Z",
      endedAt: "2026-07-02T09:30:00Z",
      date: "2026-07-02",
      pomodoroCount: 1,
      productivityRating: 3,
    })
    console.log(`✓ Created 2 more sessions\n`)

    // Test 3: Get session by ID
    console.log("3️⃣ Testing getSessionById...")
    const retrieved = await getSessionById(session1.id)
    if (!retrieved) {
      throw new Error("Failed to retrieve session by ID")
    }
    console.log(`✓ Retrieved session: ${retrieved.taskName}`)
    if (retrieved.id !== session1.id || retrieved.taskName !== session1.taskName) {
      throw new Error("Retrieved session data doesn't match")
    }
    console.log("✓ Session data matches\n")

    // Test 4: Get all sessions
    console.log("4️⃣ Testing getAllSessions...")
    const allSessionsResult = await getAllSessions()
    console.log(`✓ Retrieved ${allSessionsResult.sessions.length} sessions (total: ${allSessionsResult.total})`)
    if (allSessionsResult.sessions.length !== 3) {
      throw new Error(`Expected 3 sessions, got ${allSessionsResult.sessions.length}`)
    }
    console.log("✓ Session count is correct\n")

    // Test 5: Get sessions by date
    console.log("5️⃣ Testing getSessionsByDate...")
    const sessionsOnDate1 = await getSessionsByDate("2026-07-01")
    console.log(`✓ Found ${sessionsOnDate1.length} sessions on 2026-07-01`)
    if (sessionsOnDate1.length !== 2) {
      throw new Error(`Expected 2 sessions on 2026-07-01, got ${sessionsOnDate1.length}`)
    }

    const sessionsOnDate2 = await getSessionsByDate("2026-07-02")
    console.log(`✓ Found ${sessionsOnDate2.length} session on 2026-07-02`)
    if (sessionsOnDate2.length !== 1) {
      throw new Error(`Expected 1 session on 2026-07-02, got ${sessionsOnDate2.length}`)
    }
    console.log("")

    // Test 6: Get sessions by date range
    console.log("6️⃣ Testing getSessionsByDateRange...")
    const sessionsInRange = await getSessionsByDateRange("2026-07-01", "2026-07-02")
    console.log(`✓ Found ${sessionsInRange.length} sessions in date range`)
    if (sessionsInRange.length !== 3) {
      throw new Error(`Expected 3 sessions in range, got ${sessionsInRange.length}`)
    }
    console.log("")

    // Test 7: Get session count
    console.log("7️⃣ Testing getSessionCount...")
    const count = await getSessionCount()
    console.log(`✓ Total session count: ${count}`)
    if (count !== 3) {
      throw new Error(`Expected count 3, got ${count}`)
    }
    console.log("")

    // Test 8: Get total focus time
    console.log("8️⃣ Testing getTotalFocusTime...")
    const totalTime = await getTotalFocusTime()
    const expectedTotal = 1500 + 3000 + 1800 // 6300 seconds = 105 minutes
    console.log(`✓ Total focus time: ${totalTime} seconds (${Math.floor(totalTime / 60)} minutes)`)
    if (totalTime !== expectedTotal) {
      throw new Error(`Expected ${expectedTotal} seconds, got ${totalTime}`)
    }
    console.log("")

    // Test 9: Delete a session
    console.log("9️⃣ Testing deleteSession...")
    await deleteSession(session2.id)
    const afterDelete = await getSessionById(session2.id)
    if (afterDelete !== null) {
      throw new Error("Session should be deleted but was still found")
    }
    const countAfterDelete = await getSessionCount()
    console.log(`✓ Session deleted successfully`)
    console.log(`✓ Remaining session count: ${countAfterDelete}`)
    if (countAfterDelete !== 2) {
      throw new Error(`Expected 2 sessions after delete, got ${countAfterDelete}`)
    }
    console.log("")

    // Test 10: Non-existent session
    console.log("🔟 Testing getSessionById (non-existent)...")
    const nonExistent = await getSessionById("00000000-0000-0000-0000-000000000000")
    if (nonExistent !== null) {
      throw new Error("Expected null for non-existent session")
    }
    console.log("✓ Returns null for non-existent session\n")

    // Cleanup
    console.log("🧹 Cleaning up test data...")
    await deleteAllSessions()
    const finalCount = await getSessionCount()
    if (finalCount !== 0) {
      throw new Error(`Expected 0 sessions after cleanup, got ${finalCount}`)
    }
    console.log("✓ All test sessions deleted\n")

    console.log("=" .repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 2 migration is working correctly!")
    console.log("=" .repeat(60))
    console.log("\n📊 Summary:")
    console.log("  • Sessions can be created (createSession)")
    console.log("  • Sessions can be retrieved by ID (getSessionById)")
    console.log("  • All sessions can be retrieved (getAllSessions)")
    console.log("  • Sessions can be filtered by date (getSessionsByDate)")
    console.log("  • Sessions can be filtered by date range (getSessionsByDateRange)")
    console.log("  • Session count works (getSessionCount)")
    console.log("  • Total focus time calculation works (getTotalFocusTime)")
    console.log("  • Sessions can be deleted (deleteSession)")
    console.log("  • All sessions can be deleted (deleteAllSessions)")
    console.log("  • Non-existent sessions return null")
    console.log("\n✅ Module 2 (Sessions) is ready for production!")

  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule2()
