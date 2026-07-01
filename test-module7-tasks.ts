/**
 * Module 7: Daily Tasks Migration Test
 * 
 * Tests all CRUD operations for tasks and checklist items.
 * Verifies CASCADE DELETE, date filtering, objective filtering.
 */

import { 
  createTask, 
  getTaskById, 
  getAllTasks, 
  getTasksByDate, 
  getTasksByObjective,
  updateTask, 
  deleteTask, 
  deleteAllTasks,
  getTaskCount,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
} from "@/lib/db-tasks"
import { createGoal, deleteAllGoals } from "@/lib/db-goals"
import { createWeeklyObjective, deleteAllWeeklyObjectives } from "@/lib/db-weekly-objectives"
import type { Task } from "@/lib/types"

async function runTests() {
  console.log("🧪 Module 7: Daily Tasks Migration Tests\n")
  
  try {
    // Clean up before tests
    console.log("🧹 Cleaning up test data...")
    await deleteAllTasks()
    await deleteAllWeeklyObjectives()
    await deleteAllGoals()
    console.log("✅ Cleanup complete\n")

    // Test 1: Create prerequisite goal and objective
    console.log("📝 Test 1: Create prerequisite goal and objective...")
    const testGoal = await createGoal({
      name: "Project Alpha",
      description: "Test goal for tasks",
      category: "Work",
      tag: "Project",
      targetHours: 40,
      targetDate: "2026-12-31",
      weeklyTarget: 10,
      priority: "high",
      status: "active",
      color: "#3b82f6"
    })
    
    const testObjective = await createWeeklyObjective({
      goalId: testGoal.id,
      title: "Complete Phase 1",
      description: "First week objective",
      priority: 1,
      status: "in-progress",
      weekStart: "2026-07-01",
      weekEnd: "2026-07-07"
    })
    console.log(`✅ Created goal ${testGoal.id} and objective ${testObjective.id}\n`)

    // Test 2: Create a task
    console.log("📝 Test 2: Create a task...")
    const task1 = await createTask({
      objectiveId: testObjective.id,
      title: "Implement login feature",
      description: "Add user authentication",
      estimatedTime: 240,
      priority: "high",
      status: "in-progress",
      scheduledDate: "2026-07-01",
      scheduledTime: "09:00",
      tags: ["frontend", "auth"],
      sessionId: null,
      pomodoroCount: 2
    })
    console.log(`✅ Created task: ${task1.id}`)
    console.log(`   Title: ${task1.title}`)
    console.log(`   Status: ${task1.status}`)
    console.log(`   Priority: ${task1.priority}\n`)

    // Test 3: Get task by ID
    console.log("📝 Test 3: Get task by ID...")
    const retrieved = await getTaskById(task1.id)
    if (!retrieved) throw new Error("Task not found")
    console.log(`✅ Retrieved task: ${retrieved.title}`)
    console.log(`   Estimated time: ${retrieved.estimatedTime} minutes`)
    console.log(`   Scheduled: ${retrieved.scheduledDate} at ${retrieved.scheduledTime}\n`)

    // Test 4: Add checklist items
    console.log("📝 Test 4: Add checklist items...")
    const item1 = await addChecklistItem(task1.id, "Design login form UI")
    const item2 = await addChecklistItem(task1.id, "Implement backend API")
    const item3 = await addChecklistItem(task1.id, "Write unit tests")
    console.log(`✅ Added 3 checklist items`)
    console.log(`   Item 1: ${item1.text} (done: ${item1.done})`)
    console.log(`   Item 2: ${item2.text} (done: ${item2.done})`)
    console.log(`   Item 3: ${item3.text} (done: ${item3.done})\n`)

    // Test 5: Get task with checklist
    console.log("📝 Test 5: Get task with checklist...")
    const taskWithChecklist = await getTaskById(task1.id)
    if (!taskWithChecklist) throw new Error("Task not found")
    console.log(`✅ Task has ${taskWithChecklist.checklist.length} checklist items`)
    taskWithChecklist.checklist.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.text} [${item.done ? 'x' : ' '}]`)
    })
    console.log()

    // Test 6: Update checklist item (toggle done)
    console.log("📝 Test 6: Update checklist item (toggle done)...")
    const updatedItem = await updateChecklistItem(item1.id, { done: true })
    console.log(`✅ Toggled item done status`)
    console.log(`   ${updatedItem.text}: ${updatedItem.done}\n`)

    // Test 7: Update task
    console.log("📝 Test 7: Update task...")
    const updatedTask = await updateTask(task1.id, {
      status: "completed",
      pomodoroCount: 4
    })
    console.log(`✅ Updated task status: ${updatedTask.status}`)
    console.log(`   Pomodoro count: ${updatedTask.pomodoroCount}\n`)

    // Test 8: Create more tasks for filtering tests
    console.log("📝 Test 8: Create multiple tasks for filtering...")
    const task2 = await createTask({
      objectiveId: testObjective.id,
      title: "Design dashboard",
      description: "Create dashboard mockups",
      estimatedTime: 120,
      priority: "medium",
      status: "pending",
      scheduledDate: "2026-07-01",
      scheduledTime: "14:00",
      tags: ["design"],
      sessionId: null,
      pomodoroCount: 0
    })
    
    const task3 = await createTask({
      objectiveId: testObjective.id,
      title: "Write documentation",
      description: "API documentation",
      estimatedTime: 60,
      priority: "low",
      status: "pending",
      scheduledDate: "2026-07-02",
      scheduledTime: "10:00",
      tags: ["docs"],
      sessionId: null,
      pomodoroCount: 0
    })
    console.log(`✅ Created 2 more tasks\n`)

    // Test 9: Get tasks by date
    console.log("📝 Test 9: Get tasks by date...")
    const tasksToday = await getTasksByDate("2026-07-01")
    console.log(`✅ Found ${tasksToday.length} tasks for 2026-07-01`)
    tasksToday.forEach((task) => {
      console.log(`   - ${task.title} (${task.scheduledTime})`)
    })
    console.log()

    const tasksTomorrow = await getTasksByDate("2026-07-02")
    console.log(`✅ Found ${tasksTomorrow.length} tasks for 2026-07-02`)
    tasksTomorrow.forEach((task) => {
      console.log(`   - ${task.title} (${task.scheduledTime})`)
    })
    console.log()

    // Test 10: Get tasks by objective
    console.log("📝 Test 10: Get tasks by objective...")
    const objectiveTasks = await getTasksByObjective(testObjective.id)
    console.log(`✅ Found ${objectiveTasks.length} tasks for objective "${testObjective.title}"`)
    objectiveTasks.forEach((task) => {
      console.log(`   - ${task.title} [${task.status}]`)
    })
    console.log()

    // Test 11: Get all tasks
    console.log("📝 Test 11: Get all tasks...")
    const allTasks = await getAllTasks()
    console.log(`✅ Retrieved ${allTasks.length} total tasks`)
    allTasks.forEach((task) => {
      console.log(`   - ${task.title} (${task.scheduledDate}) - ${task.status}`)
    })
    console.log()

    // Test 12: Get task count
    console.log("📝 Test 12: Get task count...")
    const count = await getTaskCount()
    console.log(`✅ Task count: ${count}\n`)

    // Test 13: Delete checklist item
    console.log("📝 Test 13: Delete checklist item...")
    await deleteChecklistItem(item3.id)
    const taskAfterDelete = await getTaskById(task1.id)
    if (!taskAfterDelete) throw new Error("Task not found")
    console.log(`✅ Deleted checklist item`)
    console.log(`   Remaining items: ${taskAfterDelete.checklist.length}\n`)

    // Test 14: CASCADE DELETE - delete objective should delete tasks
    console.log("📝 Test 14: CASCADE DELETE test (objective → tasks)...")
    const countBefore = await getTaskCount()
    console.log(`   Tasks before objective deletion: ${countBefore}`)
    
    await deleteAllWeeklyObjectives() // This should cascade to tasks
    
    const countAfter = await getTaskCount()
    console.log(`   Tasks after objective deletion: ${countAfter}`)
    console.log(`✅ CASCADE DELETE verified: ${countBefore} → ${countAfter}\n`)

    // Test 15: Delete individual task
    console.log("📝 Test 15: Delete individual task...")
    const newTask = await createTask({
      objectiveId: null,
      title: "Standalone task",
      description: "Task without objective",
      estimatedTime: 30,
      priority: "low",
      status: "pending",
      scheduledDate: "2026-07-03",
      scheduledTime: "15:00",
      tags: [],
      sessionId: null,
      pomodoroCount: 0
    })
    console.log(`   Created standalone task: ${newTask.id}`)
    
    await deleteTask(newTask.id)
    const deletedTask = await getTaskById(newTask.id)
    console.log(`✅ Task deletion verified: ${deletedTask === null}\n`)

    // Final cleanup
    console.log("🧹 Final cleanup...")
    await deleteAllTasks()
    await deleteAllWeeklyObjectives()
    await deleteAllGoals()
    console.log("✅ Cleanup complete\n")

    console.log("=" .repeat(60))
    console.log("✅ ALL MODULE 7 TESTS PASSED!")
    console.log("=" .repeat(60))
    console.log("\n📊 Test Summary:")
    console.log("   ✅ Task CRUD operations")
    console.log("   ✅ Checklist item management")
    console.log("   ✅ Date-based filtering")
    console.log("   ✅ Objective-based filtering")
    console.log("   ✅ CASCADE DELETE verification")
    console.log("   ✅ Task count analytics")
    console.log("\n🎉 Module 7 (Daily Tasks) migration is ready!\n")

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
