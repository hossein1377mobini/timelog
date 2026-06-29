"use client";

import { useState, useEffect } from "react";

/**
 * A hook that re-reads a value from `readFn` on every cross-tab
 * `storage` event. Also calls `readFn` once on mount to initialise
 * the state.
 *
 * @param readFn  A function that returns the current value from
 *                localStorage (or any synchronous source).
 * @param keys    Optional list of storage keys to listen for. If
 *                provided, only events whose `e.key` matches one of
 *                these keys will trigger a re-read. If omitted, every
 *                storage event triggers a re-read.
 *
 * @example
 * const sessions = useStorageSync(() => getSessions(), ["compass_sessions"]);
 */
export function useStorageSync<T>(readFn: () => T, keys?: string[]): T {
  const [value, setValue] = useState<T>(readFn);

  useEffect(() => {
    function onStorage(e?: StorageEvent) {
      if (keys && e?.key && !keys.includes(e.key)) return;
      setValue(readFn());
    }

    // Also listen to a custom event so same-tab writes can trigger
    // updates (the native `storage` event only fires for *other* tabs).
    function onCustom() {
      setValue(readFn());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("compass-storage-update", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("compass-storage-update", onCustom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

/**
 * Dispatch a custom event so that same-tab listeners in
 * `useStorageSync` can pick up writes.
 */
export function notifyStorageChange() {
  window.dispatchEvent(new Event("compass-storage-update"));
}