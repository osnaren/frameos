import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { photoTextureUrl, planetPlaceholderStyle } from './photo-source'
import { loadPlanetImage, paintStillPlanet } from './planet-renderer'

import type { Photo } from '@/types/photo'

/**
 * A still pocket planet: painted once into a canvas, then turned with CSS.
 *
 * Until it is painted (and for visitors without JavaScript) a palette disc
 * holds its place, so the layout never moves. Painting waits until the planet
 * is near the viewport.
 */
export function PlanetStill({
  photo,
  horizon,
  glow,
  cssSize,
  className,
  eager = false,
  onPainted,
}: {
  photo: Photo
  horizon: number
  glow?: string
  /** Render resolution in CSS px; the element itself is sized by CSS. */
  cssSize: number
  className?: string
  eager?: boolean
  onPainted?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [painted, setPainted] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    let cancelled = false
    const paint = () => {
      const width = Math.min(1024, Math.max(480, Math.round(cssSize * 2.4)))
      loadPlanetImage(photoTextureUrl(photo, width))
        .then((image) => {
          if (cancelled) {
            return
          }
          if (paintStillPlanet(canvas, image, { cssSize, horizon, glow })) {
            setPainted(true)
            onPainted?.()
          }
        })
        .catch(() => {
          /* the palette disc stays: still a complete, if quieter, planet */
        })
    }

    if (eager || typeof IntersectionObserver === 'undefined') {
      paint()
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          paint()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(canvas)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [photo, horizon, glow, cssSize, eager, onPainted])

  return (
    <span className={cn('planet-still', className)} data-painted={painted}>
      <span className="planet-still__placeholder" style={planetPlaceholderStyle(photo)} />
      <canvas ref={canvasRef} className="planet-still__canvas" aria-hidden="true" />
    </span>
  )
}
