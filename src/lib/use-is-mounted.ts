"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` on the server and during hydration, `true` right after hydration.
 *
 * Replaces the `useState(false) + useEffect(() => setMounted(true), [])` hydration guard,
 * which `react-hooks/set-state-in-effect` (eslint-plugin-react-hooks v7, enabled by
 * `eslint-config-next` 16) rejects.
 */
export function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
