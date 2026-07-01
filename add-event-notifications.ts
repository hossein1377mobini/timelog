/**
 * Script to add event notifications to all database write operations.
 * This adds notifyDatabaseChange() calls after all create/update/delete operations.
 */

import * as fs from 'fs'
import * as path from 'path'

const DB_FILES = [
  'lib/db-settings.ts',
  'lib/db-sessions.ts',
  'lib/db-interruptions.ts',
  'lib/db-goals.ts',
  'lib/db-reflections.ts',
  'lib/db-weekly-objectives.ts',
  'lib/db-tasks.ts',
  'lib/db-roadmaps.ts',
]

// Import statement to add
const IMPORT_STATEMENT = 'import { notifyDatabaseChange } from "@/lib/db-events"'

// Functions that should trigger notifications (write operations)
const WRITE_FUNCTIONS = [
  'setSetting',
  'deleteSetting',
  'createSession',
  'updateSessionRating',
  'deleteSession',
  'deleteAllSessions',
  'createInterruption',
  'deleteInterruption',
  'deleteAllInterruptions',
  'createGoal',
  'updateGoal',
  'deleteGoal',
  'deleteAllGoals',
  'createReflection',
  'deleteReflectionByDate',
  'deleteAllReflections',
  'createWeeklyObjective',
  'updateWeeklyObjective',
  'deleteWeeklyObjective',
  'deleteAllWeeklyObjectives',
  'createTask',
  'updateTask',
  'updateChecklistItem',
  'deleteChecklistItem',
  'deleteTask',
  'deleteAllTasks',
  'saveRoadmapForGoal',
  'deleteRoadmapForGoal',
  'deleteAllRoadmapPhases',
  'saveRoadmapTree',
  'addRoadmapNode',
  'updateRoadmapNode',
  'deleteRoadmapNode',
  'deleteRoadmapTree',
  'deleteAllRoadmapNodes',
]

function addEventNotifications(filePath: string) {
  console.log(`\n📝 Processing ${filePath}...`)
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Check if import already exists
  if (content.includes('notifyDatabaseChange')) {
    console.log(`   ⏭️  Already has event notifications`)
    return
  }
  
  let updatedContent = content
  
  // Add import statement after the last import
  const lastImportIndex = content.lastIndexOf('import ')
  const nextNewlineAfterImport = content.indexOf('\n', lastImportIndex)
  updatedContent = 
    content.slice(0, nextNewlineAfterImport + 1) +
    IMPORT_STATEMENT + '\n' +
    content.slice(nextNewlineAfterImport + 1)
  
  // Add notifyDatabaseChange() before the final finally block of write functions
  for (const funcName of WRITE_FUNCTIONS) {
    const funcRegex = new RegExp(
      `export async function ${funcName}\\([^)]*\\)[^{]*{[\\s\\S]*?}(?=\\s*(?:export|$))`,
      'g'
    )
    
    updatedContent = updatedContent.replace(funcRegex, (match) => {
      // Skip if already has notification
      if (match.includes('notifyDatabaseChange')) {
        return match
      }
      
      // Find the last occurrence of client.release() and add notification before it
      const finallyIndex = match.lastIndexOf('} finally {')
      if (finallyIndex === -1) return match
      
      const releaseIndex = match.indexOf('client.release()', finallyIndex)
      if (releaseIndex === -1) return match
      
      // Insert notification before client.release()
      const beforeRelease = match.slice(0, releaseIndex)
      const afterRelease = match.slice(releaseIndex)
      
      return beforeRelease + 'notifyDatabaseChange()\n    ' + afterRelease
    })
  }
  
  // Write back
  fs.writeFileSync(filePath, updatedContent, 'utf-8')
  console.log(`   ✅ Added event notifications`)
}

// Process all files
console.log('🚀 Adding event notifications to database modules...')

for (const file of DB_FILES) {
  if (fs.existsSync(file)) {
    addEventNotifications(file)
  } else {
    console.log(`\n⚠️  File not found: ${file}`)
  }
}

console.log('\n✨ Done! All database modules updated with event notifications.')
