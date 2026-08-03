import { useEffect, useMemo, useRef } from 'react'

import { Link } from '@tanstack/react-router'
import { useReducedMotion } from 'framer-motion'

import { PhotoImage } from '@/components/photo/PhotoImage'

import type { WorldDefinition } from '@/content/worlds'
import type { Photo } from '@/types/photo'

interface DomeTile {
  key: string
  photo: Photo
  rotateY: number
  rotateX: number
}

/**
 * A handful of curated photos read as a sparse, awkward ring if each one
 * only gets a single slot — real gallery-wall components fill the circle by
 * repeating the source images round-robin, and so do we: never two of the
 * same photo next to each other, and every world (even a 3-photo one) reads
 * as a full, deliberate ring rather than a few cards adrift in empty space.
 * A gentle sine gives the ring a domed silhouette without the complexity
 * (and projection overlap) of true multiple latitude rows.
 */
function buildTiles(photos: Photo[]): {
  tiles: DomeTile[]
  cols: number
  tileSize: string
  radiusFactor: number
} {
  if (photos.length === 0) {
    return { tiles: [], cols: 0, tileSize: '150px', radiusFactor: 1.6 }
  }

  const cols = Math.min(12, Math.max(8, photos.length * 2))
  const tileSize =
    cols >= 11
      ? 'clamp(112px, 12vw, 176px)'
      : cols >= 9
        ? 'clamp(122px, 13vw, 192px)'
        : 'clamp(134px, 14.5vw, 208px)'

  // The radius (as a multiple of tile size) needed so adjacent tiles don't
  // overlap depends on how many degrees apart they sit: tighter rings (more
  // cols, smaller angle each) need proportionally MORE radius. A fixed
  // radius across every cols count is what caused visible tile overlap —
  // this derives it from the actual chord geometry instead, plus 15% for
  // comfortable breathing room and perspective distortion.
  const radiusFactor = Math.round((1 / (2 * Math.sin(Math.PI / cols))) * 1.15 * 100) / 100

  const assigned = Array.from({ length: cols }, (_, index) => photos[index % photos.length])
  for (let i = 1; i < assigned.length; i++) {
    if (assigned[i].slug === assigned[i - 1].slug) {
      for (let j = i + 1; j < assigned.length; j++) {
        if (assigned[j].slug !== assigned[i].slug) {
          const temp = assigned[i]
          assigned[i] = assigned[j]
          assigned[j] = temp
          break
        }
      }
    }
  }
  // The wrap seam (last slot next to the first) can repeat too — check it last.
  if (assigned.length > 1 && assigned[assigned.length - 1].slug === assigned[0].slug) {
    for (let j = 1; j < assigned.length - 1; j++) {
      if (assigned[j].slug !== assigned[0].slug) {
        const temp = assigned[assigned.length - 1]
        assigned[assigned.length - 1] = assigned[j]
        assigned[j] = temp
        break
      }
    }
  }

  const TILT_PHASE_DEG = 45
  const TILT_AMPLITUDE_DEG = 7

  const tiles = assigned.map((photo, index) => {
    const rotateY = (360 / cols) * index
    // Rounded: Math.sin can return a bit-for-bit different float on the
    // server's V8 vs the browser's, and that tiny difference is enough for
    // React to flag a hydration mismatch on this inline style.
    const rotateX =
      Math.round(
        Math.sin((rotateY + TILT_PHASE_DEG) * (Math.PI / 180)) * TILT_AMPLITUDE_DEG * 100
      ) / 100
    return { key: `${photo.slug}-${index}`, photo, rotateY, rotateX }
  })

  return { tiles, cols, tileSize, radiusFactor }
}

const AUTO_ROTATE_DEG_PER_SEC = 3
/** Low = a flick coasts for a couple of seconds before settling; high = it snaps back instantly. */
const RELAX_RATE = 0.45
const MAX_FLICK_DEG_PER_SEC = 640
const DRAG_MOVE_THRESHOLD = 6
const MAX_TILT = 16
const MIN_TILT = -22

/**
 * The world's photos, glued to the inside of a dome you can drag to spin —
 * a DOM/CSS-only replacement for the old WebGL "planet" (no shaders, no
 * lighting rig, no bundle weight, and it actually shows the photographs).
 */
export function WorldDome({ world, photos }: { world: WorldDefinition; photos: Photo[] }) {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const { tiles, tileSize, radiusFactor } = useMemo(() => buildTiles(photos), [photos])
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles

  const rotation = useRef({ x: -8, y: 0 })
  const velocityY = useRef(0)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    lastX: number
    lastY: number
    lastT: number
    startRotX: number
    startRotY: number
  } | null>(null)
  const draggedRef = useRef(false)
  const hoveredRef = useRef(false)

  useEffect(() => {
    const stage = stageRef.current
    const root = rootRef.current
    if (!stage || !root) {
      return
    }

    const applyTransform = () => {
      stage.style.transform = `rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`

      // Depth cueing: tiles facing away from the viewer recede visually (dimmer,
      // softer) so the ring reads as something you're looking INTO rather than a
      // flat strip of cards with a fake tilt. Written directly to the DOM (no CSS
      // transition) so it stays perfectly in lockstep with the transform above.
      //
      // IMPORTANT: this must be written to the FRAME (the translateZ leaf), never
      // to the .world-dome__tile wrapper. A computed opacity other than 1 forces
      // transform-style to flat on the element it's set on -- setting it on the
      // tile (which declares preserve-3d so the frame's translateZ composes with
      // the tile's own rotateY/rotateX) silently flattened the frame's 3D
      // position, collapsing every tile onto the same spot on screen regardless
      // of its ring angle. The frame itself has no 3D children, so flattening it
      // is harmless.
      //
      // The falloff is measured in "steps" (the angle between adjacent tiles),
      // not raw degrees: a plain cosine stays near-1 for a wide arc around
      // center, so two neighbouring tiles were both ~95%+ opaque at once and
      // collided into a "half-open book" look whenever the ring passed the
      // midpoint between them. Normalizing by the step size guarantees the
      // fade completes before the next tile takes over, so only one tile is
      // ever the clear "hero" at a time.
      const currentTiles = tilesRef.current
      const stepDeg = 360 / currentTiles.length
      for (let i = 0; i < currentTiles.length; i++) {
        const el = frameRefs.current[i]
        if (!el) continue
        const wrapped = (((currentTiles[i].rotateY + rotation.current.y) % 360) + 360) % 360
        const angleDiff = wrapped > 180 ? wrapped - 360 : wrapped
        const normalized = Math.min(1, Math.abs(angleDiff) / (stepDeg * 0.9))
        const facing = 1 - normalized * normalized * (3 - 2 * normalized) // smoothstep falloff
        el.style.opacity = (0.35 + 0.65 * facing).toFixed(2)
        el.style.filter = facing > 0.96 ? 'none' : `blur(${((1 - facing) * 3).toFixed(2)}px)`
      }
    }

    applyTransform()

    let raf = 0
    let last = performance.now()

    const tick = (time: number) => {
      const delta = Math.min((time - last) / 1000, 1 / 30)
      last = time

      if (!dragRef.current) {
        const baseline = reducedMotion || hoveredRef.current ? 0 : AUTO_ROTATE_DEG_PER_SEC
        velocityY.current += (baseline - velocityY.current) * Math.min(1, RELAX_RATE * delta)
        rotation.current.y += velocityY.current * delta
        applyTransform()
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      root.classList.add('is-interacted')
      draggedRef.current = false
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastT: performance.now(),
        startRotX: rotation.current.x,
        startRotY: rotation.current.y,
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) {
        return
      }

      const dxTotal = event.clientX - drag.startX
      const dyTotal = event.clientY - drag.startY
      if (!draggedRef.current && Math.hypot(dxTotal, dyTotal) > DRAG_MOVE_THRESHOLD) {
        draggedRef.current = true
        // Capture only once a real drag starts, so a plain click's native
        // anchor navigation is never redirected away from its target.
        root.setPointerCapture(event.pointerId)
      }

      rotation.current.y = drag.startRotY + dxTotal * 0.32
      rotation.current.x = Math.min(MAX_TILT, Math.max(MIN_TILT, drag.startRotX - dyTotal * 0.22))
      applyTransform()

      const now = performance.now()
      const dt = Math.max(now - drag.lastT, 1)
      const instantVelocity = ((event.clientX - drag.lastX) / dt) * 1000 * 0.32
      velocityY.current = Math.min(
        MAX_FLICK_DEG_PER_SEC,
        Math.max(-MAX_FLICK_DEG_PER_SEC, instantVelocity)
      )
      drag.lastX = event.clientX
      drag.lastY = event.clientY
      drag.lastT = now
    }

    const endDrag = (event: PointerEvent) => {
      if (dragRef.current?.pointerId !== event.pointerId) {
        return
      }
      dragRef.current = null
      if (draggedRef.current) {
        // Swallow the click that follows a drag release so tiles don't navigate mid-spin.
        window.setTimeout(() => (draggedRef.current = false), 80)
      }
    }

    root.addEventListener('pointerdown', handlePointerDown)
    root.addEventListener('pointermove', handlePointerMove)
    root.addEventListener('pointerup', endDrag)
    root.addEventListener('pointercancel', endDrag)

    const handlePointerEnter = () => {
      hoveredRef.current = true
    }
    const handlePointerLeave = () => {
      hoveredRef.current = false
    }
    root.addEventListener('pointerenter', handlePointerEnter)
    root.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      cancelAnimationFrame(raf)
      root.removeEventListener('pointerdown', handlePointerDown)
      root.removeEventListener('pointermove', handlePointerMove)
      root.removeEventListener('pointerup', endDrag)
      root.removeEventListener('pointercancel', endDrag)
      root.removeEventListener('pointerenter', handlePointerEnter)
      root.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [reducedMotion])

  if (tiles.length === 0) {
    return null
  }

  return (
    <div
      ref={rootRef}
      className="world-dome"
      style={
        {
          '--dome-tile-size': tileSize,
          '--dome-radius-factor': radiusFactor,
        } as React.CSSProperties
      }
      role="group"
      aria-label={`${world.name} photographs — drag to look around`}
      onClickCapture={(event) => {
        if (draggedRef.current) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      <span aria-hidden="true" className="world-dome__ground" />
      <div className="world-dome__stage" ref={stageRef}>
        {tiles.map((tile, index) => (
          <div
            key={tile.key}
            className="world-dome__tile"
            style={{ transform: `rotateY(${tile.rotateY}deg) rotateX(${tile.rotateX}deg)` }}
          >
            <Link
              ref={(el) => {
                frameRefs.current[index] = el
              }}
              to="/photos/$slug"
              params={{ slug: tile.photo.slug }}
              aria-label={`View “${tile.photo.title}”`}
              className="world-dome__frame group block no-underline"
              draggable={false}
            >
              {/* Rounded clip lives on its own layer, separate from the translateZ push
                  above — combining overflow:hidden/border-radius with a large 3D offset
                  on one element is what caused Chromium to intermittently paint a tile
                  blank mid-spin. */}
              <span className="pocket-frame world-dome__clip">
                <PhotoImage
                  publicId={tile.photo.publicId}
                  alt={tile.photo.alt}
                  preset="gallery"
                  sizes="220px"
                  lqip={tile.photo.image?.lqip}
                  hotspot={tile.photo.image?.hotspot}
                  className="h-full w-full object-cover"
                />
                <span aria-hidden="true" className="frame-corners" />
              </span>
              <span className="world-dome__caption">{tile.photo.title}</span>
            </Link>
          </div>
        ))}
      </div>
      <span aria-hidden="true" className="world-dome__vignette" />
      <span aria-hidden="true" className="world-dome__hint">
        ‹ drag to look around ›
      </span>
    </div>
  )
}
