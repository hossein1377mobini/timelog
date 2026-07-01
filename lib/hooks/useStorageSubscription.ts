import { useEffect } from "react";
import { subscribeToStorage } from "@/lib/storage";

/**
 * React hook to subscribe to storage changes (localStorage sync).
 * Automatically cleans up the subscription on unmount.
 * 
 * Listens to both:
 * - Native "storage" events (cross-tab synchronization)
 * - Custom "compass-storage-update" events (same-tab updates)
 * 
 * @param handler - Callback function to run when storage changes
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [data, setData] = useState(getGoals());
 *   
 *   useStorageSubscription(() => {
 *     setData(getGoals());
 *   });
 *   
 *   return <div>{data.length} goals</div>;
 * }
 * ```
 */
export function useStorageSubscription(handler: () => void): void {
  useEffect(() => {
    const unsubscribe = subscribeToStorage(handler);
    return unsubscribe;
  }, [handler]);
}
