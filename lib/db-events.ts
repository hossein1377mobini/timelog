/**
 * Database event notifications for UI synchronization.
 * 
 * This module provides a centralized function to dispatch storage change events
 * after database write operations, ensuring UI components stay in sync with
 * database changes.
 */

/**
 * Notify all components that database state has changed.
 * Dispatches the 'compass-storage-update' event so React components
 * using useStorageSync can re-fetch data.
 * 
 * Should be called after any database write operation (create, update, delete).
 */
export function notifyDatabaseChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("compass-storage-update"))
}
