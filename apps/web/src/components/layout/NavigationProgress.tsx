import { useEffect, useRef, useState } from 'react'

import { useRouter, useRouterState } from '@tanstack/react-router'

/** Navigations faster than this never show the bar. */
const SHOW_AFTER_MS = 140
const DONE_HOLD_MS = 420

type ProgressState = 'idle' | 'loading' | 'done'

/**
 * A slim bar across the top while a client navigation waits on data, plus
 * the two things a single-page app owes assistive tech on every page change:
 * an announcement of where you landed, and focus that isn't stranded on a
 * link that no longer exists.
 */
export function NavigationProgress() {
  const router = useRouter()
  const isLoading = useRouterState({ select: (state) => state.isLoading })
  const [state, setState] = useState<ProgressState>('idle')
  const [announcement, setAnnouncement] = useState('')
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading) {
      const timer = window.setTimeout(() => setState('loading'), SHOW_AFTER_MS)
      return () => window.clearTimeout(timer)
    }

    setState((current) => (current === 'loading' ? 'done' : current))
    const timer = window.setTimeout(() => setState('idle'), DONE_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [isLoading])

  useEffect(
    () =>
      router.subscribe('onResolved', ({ toLocation, pathChanged }) => {
        const previous = lastPathname.current
        lastPathname.current = toLocation.pathname

        // Filter and lightbox changes keep the pathname and announce themselves.
        if (!pathChanged || previous === null) {
          return
        }

        window.requestAnimationFrame(() => {
          setAnnouncement(document.title)

          const focused = document.activeElement
          if (!focused || focused === document.body || !focused.isConnected) {
            document.getElementById('main-content')?.focus({ preventScroll: true })
          }
        })
      }),
    [router]
  )

  return (
    <>
      <div className="nav-progress" data-state={state} aria-hidden="true">
        <span />
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </>
  )
}
