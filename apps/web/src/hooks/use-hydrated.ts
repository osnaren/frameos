import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

/**
 * False during server render and hydration, true afterwards. Gate anything
 * that only exists in the browser (history state, media queries) behind it
 * so the first client render matches the server HTML exactly.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
