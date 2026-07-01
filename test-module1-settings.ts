/**
 * Test script for Module 1: Settings & Onboarding migration
 * Tests database-backed settings CRUD operations
 */

import { getSetting, setSetting, deleteSetting, getAllSettings } from "./lib/db-settings"
import pool from "./lib/db"

async function testModule1() {
  console.log("🧪 Testing Module 1: Settings & Onboarding Migration\n")

  try {
    // Test 1: Set onboarding status
    console.log("1️⃣ Testing setSetting (onboarding)...")
    await setSetting("compass_onboarding_done", "true")
    console.log("✓ Onboarding status set to 'true'\n")

    // Test 2: Get onboarding status
    console.log("2️⃣ Testing getSetting (onboarding)...")
    const onboardingStatus = await getSetting("compass_onboarding_done")
    console.log(`✓ Retrieved onboarding status: ${onboardingStatus}`)
    if (onboardingStatus !== "true") {
      throw new Error("Expected 'true', got: " + onboardingStatus)
    }
    console.log("✓ Value matches expected result\n")

    // Test 3: Update existing setting (upsert)
    console.log("3️⃣ Testing setSetting (upsert)...")
    await setSetting("compass_onboarding_done", "false")
    const updated = await getSetting("compass_onboarding_done")
    console.log(`✓ Updated onboarding status: ${updated}`)
    if (updated !== "false") {
      throw new Error("Expected 'false', got: " + updated)
    }
    console.log("✓ Upsert works correctly\n")

    // Test 4: Set multiple settings
    console.log("4️⃣ Testing multiple settings...")
    await setSetting("test_setting_1", "value1")
    await setSetting("test_setting_2", "value2")
    await setSetting("test_setting_3", "value3")
    console.log("✓ Created 3 test settings\n")

    // Test 5: Get all settings
    console.log("5️⃣ Testing getAllSettings...")
    const allSettings = await getAllSettings()
    console.log("✓ Retrieved all settings:")
    console.log(JSON.stringify(allSettings, null, 2))
    console.log("")

    // Test 6: Get non-existent setting
    console.log("6️⃣ Testing getSetting (non-existent)...")
    const nonExistent = await getSetting("does_not_exist")
    console.log(`✓ Non-existent setting returns: ${nonExistent}`)
    if (nonExistent !== null) {
      throw new Error("Expected null, got: " + nonExistent)
    }
    console.log("✓ Returns null as expected\n")

    // Test 7: Delete setting
    console.log("7️⃣ Testing deleteSetting...")
    await deleteSetting("test_setting_2")
    const afterDelete = await getSetting("test_setting_2")
    console.log(`✓ After deletion, test_setting_2 returns: ${afterDelete}`)
    if (afterDelete !== null) {
      throw new Error("Expected null after deletion, got: " + afterDelete)
    }
    console.log("✓ Deletion works correctly\n")

    // Cleanup
    console.log("🧹 Cleaning up test data...")
    await deleteSetting("test_setting_1")
    await deleteSetting("test_setting_3")
    await setSetting("compass_onboarding_done", "false") // Reset to default
    console.log("✓ Test data cleaned up\n")

    console.log("=" .repeat(60))
    console.log("✅ ALL TESTS PASSED - Module 1 migration is working correctly!")
    console.log("=" .repeat(60))
    console.log("\n📊 Summary:")
    console.log("  • Settings can be created (setSetting)")
    console.log("  • Settings can be read (getSetting)")
    console.log("  • Settings can be updated (upsert)")
    console.log("  • Settings can be deleted (deleteSetting)")
    console.log("  • All settings can be retrieved (getAllSettings)")
    console.log("  • Non-existent settings return null")
    console.log("\n✅ Module 1 (Settings & Onboarding) is ready for production!")
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:")
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testModule1()
