import { useEffect, useRef } from 'react'

import { useRouterState } from '@tanstack/react-router'
import gsap from 'gsap'

/**
 * A small viewfinder badge that trails the pointer and locks onto any
 * `.pocket-frame` it crosses — the same corner-bracket motif drawn on every
 * photograph, brought to the cursor itself. Skipped entirely on the home
 * and Archive pages (Archive owns its more precise four-point cursor), touch
 * devices, and under reduced motion.
 */
export function ViewfinderCursor() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  if (pathname === '/' || pathname === '/archive') {
    return null
  }

  return <ViewfinderCursorLayer />
}

function ViewfinderCursorLayer() {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) {
      return
    }

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(pointer: fine)').matches
    ) {
      return
    }

    gsap.set(ring, { xPercent: -50, yPercent: -50 })
    const setX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' })
    const setY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' })

    const handleMove = (event: PointerEvent) => {
      setX(event.clientX)
      setY(event.clientY)
    }

    /** Delegated so newly rendered frames (route changes, filters) need no re-binding. */
    const handleOver = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('.pocket-frame')) {
        ring.dataset.active = 'true'
      }
    }

    const handleOut = (event: PointerEvent) => {
      const related = event.relatedTarget
      const stillInsideFrame = related instanceof Element && related.closest('.pocket-frame')
      if (!stillInsideFrame) {
        ring.dataset.active = 'false'
      }
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('pointerover', handleOver)
    document.addEventListener('pointerout', handleOut)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerover', handleOver)
      document.removeEventListener('pointerout', handleOut)
    }
  }, [])

  return (
    <div ref={ringRef} aria-hidden="true" className="viewfinder-cursor" data-active="false">
      <span className="viewfinder-cursor__brackets" />
      <span className="viewfinder-cursor__label">View</span>
    </div>
  )
}
