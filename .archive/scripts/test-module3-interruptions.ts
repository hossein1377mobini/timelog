/**
 * Test script for Module 3: Interruptions migration
 * Tests database-backed interruptions CRUD operations
 */

import {
  createInterruption,
  getAllInterruptions,
  getInterruptionsBySession,
  deleteInterruption,
  deleteAllInterruptions,
  getInterruptionCount,
  getTotalInterruptionTime,
} from "./lib/db-interruptions"
import pool from "./lib/db"

async function testModule3() {
  console.log("🧪 Testing Module 3: Interruptions Migration\n")

  try {
    // Cleanup
    await deleteAllInterruptions()

    // Test 1: Create interruptions
    console.log("1️⃣ Testing createInterruption...")
    const interruption1 = await createInterruption({
      sessionId: null,
      type: "distraction",
      cause: "Phone notification",
      duration: 120, // 2 minutes
      note: "Checked messages",
      timestamp: "2026-07-01T10:15:00Z",
      recoveryTime: 60,
      severity: "low",
    })
    console.log(`✓ Created interruption: ${interruption1.cause}`)
    console.log(`  Type: ${interruption1.type}, Severity: ${interruption1.severity}\n`)

    const interruption2 = await createInterruption({
      sessionId: null,
      type: "external",
      cause: "Colleague question",
      duration: 300,
      note: "Helped with code issue",
      timestamp: "2026-07-01T11:00:00Z",
      recoveryTime: 180,
      severity: "medium",
    })

    const interruption3 = await createInterruption({
      sessionId: null,
      type: "thought",
      cause: "Idea for another project",
      duration: 60,
      note: "Wrote it down",
      timestamp: "2026-07-02T09:30:00Z",
      recoveryTime: 30,
      severity: "low",
    })

    // Test 2: Get all interruptions
    console.log("2️⃣ Testing getAllInterruptions...")
    const all = await getAllInterruptions()
    console.log(`✓ Retrieved ${all.length} interruptions`)
    if (all.length !== 3) {
      throw new Error(`Expected 3 interruptions, got ${all.length}`)
    }
    console.log("")

    // Test 3: Get interruption count
    console.log("3️⃣ Testing getInterruptionCount...")
    const count = await getInterruptionCount()
    console.log(`✓ Interruption count: ${count}`)
    if (count !== 3) {
      throw new Error(`Expected count 3, got ${count}`)
    }
    console.log("")

    // Test 4: Get total interruption time
    console.log("4️⃣ Testing getTotalInterruptionTime...")
    const totalTime = await getTotalInterruptionTime()
    const expectedTotal = 120 + 300 + 60
    console.log(`✓ Total interruption time: ${totalTime} seconds`)
    if (totalTime !== expectedTotal) {
      throw new Error(`Expected ${expectedTotal}, got ${totalTime}`)
    }
    console.log("")

    // Test 5: Delete interruption
    console.log("5️⃣ Testing deleteInterruption...")
    await deleteInterruption(interruption2.id)
    const afterDelete = await getInterruptionCount()
    console.log(`✓ After delete, count: ${afterDelete}`)
    if (afterDelete !== 2) {
      throw new Error(`Expected 2 after delete, got ${afterDelete}`)
    }
    console.log("")

    // Cleanup
    console.log("🧹 Cleaning up...")
    await deleteAllInterruptions()
    const finalCount = await getInterruptionCount()
    if (finalCount !== 0) {
      throw new Error(`Expected 0 after cleanup, got ${finalCount}`)
    }
    console.log("✓ Cleanup complete\n")

    console.log("=".repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 3 is working correctly!")
    console.log("=".repeat(60))
    console.log("\n✅ Module 3 (Interruptions) is ready for production!")

  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule3()
