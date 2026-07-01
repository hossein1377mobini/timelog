/**
 * Test script for Module 5: Reflections migration
 * Tests database-backed reflections CRUD operations
 */

import {
  createReflection,
  getReflectionByDate,
  getAllReflections,
  upsertReflection,
  deleteReflectionByDate,
  deleteAllReflections,
  getReflectionCount,
  getReflectionsByDateRange,
} from "./lib/db-reflections"
import pool from "./lib/db"

async function testModule5() {
  console.log("🧪 Testing Module 5: Reflections Migration\n")

  try {
    // Cleanup
    await deleteAllReflections()

    // Test 1: Create reflections
    console.log("1️⃣ Testing createReflection...")
    const reflection1 = await createReflection({
      date: "2026-07-01",
      mood: 8,
      accomplishments: ["Completed TypeScript migration", "Fixed 3 bugs"],
      challenges: ["Database connection issues"],
      improvements: ["Better error handling"],
      rating: 8,
      wins: ["Successful deployment"],
      tomorrowPlan: "Start on new feature",
      notes: "Great productive day",
    })
    console.log(`✓ Created reflection for ${reflection1.date}`)
    console.log(`  Mood: ${reflection1.mood}, Rating: ${reflection1.rating}\n`)

    const reflection2 = await createReflection({
      date: "2026-07-02",
      mood: 7,
      accomplishments: ["Code review completed", "Team meeting"],
      challenges: ["Time management"],
      improvements: ["Better planning"],
      rating: 7,
      wins: ["Good collaboration"],
      tomorrowPlan: "Focus on testing",
      notes: "Solid progress",
    })
    console.log(`✓ Created reflection for ${reflection2.date}\n`)

    // Test 2: Get reflection by date
    console.log("2️⃣ Testing getReflectionByDate...")
    const retrieved = await getReflectionByDate("2026-07-01")
    if (!retrieved) {
      throw new Error("Reflection not found by date")
    }
    console.log(`✓ Retrieved reflection for ${retrieved.date}`)
    if (retrieved.mood !== 8) {
      throw new Error(`Expected mood 8, got ${retrieved.mood}`)
    }
    console.log("")

    // Test 3: Get all reflections
    console.log("3️⃣ Testing getAllReflections...")
    const all = await getAllReflections()
    console.log(`✓ Retrieved ${all.length} reflections`)
    if (all.length !== 2) {
      throw new Error(`Expected 2 reflections, got ${all.length}`)
    }
    console.log("")

    // Test 4: Upsert reflection (update existing)
    console.log("4️⃣ Testing upsertReflection (update)...")
    const updated = await upsertReflection({
      date: "2026-07-01",
      mood: 9,
      accomplishments: ["Completed TypeScript migration", "Fixed 3 bugs", "Deployed to prod"],
      challenges: ["Database connection issues"],
      improvements: ["Better error handling", "Added monitoring"],
      rating: 9,
      wins: ["Successful deployment", "Zero downtime"],
      tomorrowPlan: "Start on new feature",
      notes: "Great productive day - updated!",
    })
    console.log(`✓ Updated reflection mood to ${updated.mood}`)
    if (updated.mood !== 9) {
      throw new Error(`Expected mood 9, got ${updated.mood}`)
    }
    
    // Verify count didn't increase
    const countAfterUpdate = await getReflectionCount()
    if (countAfterUpdate !== 2) {
      throw new Error(`Expected count to remain 2, got ${countAfterUpdate}`)
    }
    console.log("")

    // Test 5: Upsert reflection (create new)
    console.log("5️⃣ Testing upsertReflection (create)...")
    const newReflection = await upsertReflection({
      date: "2026-07-03",
      mood: 6,
      accomplishments: ["Documentation"],
      challenges: ["Writer's block"],
      improvements: ["Better structure"],
      rating: 6,
      wins: ["Got it done"],
      tomorrowPlan: "Continue writing",
      notes: "Writing day",
    })
    console.log(`✓ Created new reflection for ${newReflection.date}`)
    
    const countAfterInsert = await getReflectionCount()
    if (countAfterInsert !== 3) {
      throw new Error(`Expected count 3, got ${countAfterInsert}`)
    }
    console.log("")

    // Test 6: Get reflections by date range
    console.log("6️⃣ Testing getReflectionsByDateRange...")
    const rangeReflections = await getReflectionsByDateRange("2026-07-01", "2026-07-02")
    console.log(`✓ Retrieved ${rangeReflections.length} reflections in range`)
    if (rangeReflections.length !== 2) {
      throw new Error(`Expected 2 reflections in range, got ${rangeReflections.length}`)
    }
    console.log("")

    // Test 7: Get reflection count
    console.log("7️⃣ Testing getReflectionCount...")
    const count = await getReflectionCount()
    console.log(`✓ Reflection count: ${count}`)
    if (count !== 3) {
      throw new Error(`Expected count 3, got ${count}`)
    }
    console.log("")

    // Test 8: Delete reflection by date
    console.log("8️⃣ Testing deleteReflectionByDate...")
    await deleteReflectionByDate("2026-07-03")
    const afterDelete = await getReflectionCount()
    console.log(`✓ After delete, count: ${afterDelete}`)
    if (afterDelete !== 2) {
      throw new Error(`Expected 2 after delete, got ${afterDelete}`)
    }
    console.log("")

    // Test 9: Verify deleted reflection is gone
    console.log("9️⃣ Testing deleted reflection retrieval...")
    const deleted = await getReflectionByDate("2026-07-03")
    if (deleted !== null) {
      throw new Error("Deleted reflection should be null")
    }
    console.log("✓ Deleted reflection correctly returns null\n")

    // Cleanup
    console.log("🧹 Cleaning up...")
    await deleteAllReflections()
    const finalCount = await getReflectionCount()
    if (finalCount !== 0) {
      throw new Error(`Expected 0 after cleanup, got ${finalCount}`)
    }
    console.log("✓ Cleanup complete\n")

    console.log("=".repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 5 is working correctly!")
    console.log("=".repeat(60))
    console.log("\n✅ Module 5 (Reflections) is ready for production!")

  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule5()
