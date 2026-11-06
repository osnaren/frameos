import { useEffect, useMemo, useRef, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'

import { PhotoImage } from '@/components/photo/PhotoImage'
import { useHydratedReducedMotion } from '@/lib/motion'
import { photoOriginState } from '@/lib/photo-origin'

import type { World } from '@/types/content'
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

/** Shortest signed angle (-180…180] from a ring angle to the viewer. */
function facingAngle(tileAngle: number, ringRotation: number) {
  const wrapped = (((tileAngle + ringRotation) % 360) + 360) % 360
  return wrapped > 180 ? wrapped - 360 : wrapped
}

const AUTO_ROTATE_DEG_PER_SEC = 3
/** Low = a flick coasts for a couple of seconds before settling; high = it snaps back instantly. */
const RELAX_RATE = 0.45
const MAX_FLICK_DEG_PER_SEC = 640
const DRAG_MOVE_THRESHOLD = 6
const MAX_TILT = 16
const MIN_TILT = -22
/** How quickly a keyboard step settles onto the next frame. */
const SNAP_RATE = 9

/**
 * The world's photos, glued to the inside of a dome you can turn — drag or
 * swipe sideways, or focus it and use ← → (Enter opens the frame in front).
 * Touch keeps vertical page scrolling. A plain list of every frame follows
 * it for anyone who'd rather not spin anything.
 */
export function WorldDome({ world, photos }: { world: World; photos: Photo[] }) {
  const reducedMotion = useHydratedReducedMotion()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const { tiles, tileSize, radiusFactor } = useMemo(() => buildTiles(photos), [photos])
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles
  const [frontIndex, setFrontIndex] = useState<number | null>(null)
  const frontRef = useRef(0)

  const rotation = useRef({ x: -8, y: 0 })
  const velocityY = useRef(0)
  /** Set by keyboard steps; the ring eases onto it, then auto-rotation resumes on blur. */
  const targetY = useRef<number | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    lastX: number
    lastT: number
    startRotX: number
    startRotY: number
    mouse: boolean
  } | null>(null)
  const draggedRef = useRef(false)
  const pausedRef = useRef({ hovered: false, focused: false })

  const originState = photoOriginState({ kind: 'world', world: world.slug, viaHistory: true })

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
      // not raw degrees, so only one tile is ever the clear "hero" at a time.
      const currentTiles = tilesRef.current
      const stepDeg = 360 / currentTiles.length
      let front = 0
      let frontDistance = Number.POSITIVE_INFINITY
      for (let i = 0; i < currentTiles.length; i++) {
        const angle = facingAngle(currentTiles[i].rotateY, rotation.current.y)
        if (Math.abs(angle) < frontDistance) {
          frontDistance = Math.abs(angle)
          front = i
        }
        const el = frameRefs.current[i]
        if (!el) continue
        const normalized = Math.min(1, Math.abs(angle) / (stepDeg * 0.9))
        const facing = 1 - normalized * normalized * (3 - 2 * normalized) // smoothstep falloff
        el.style.opacity = (0.35 + 0.65 * facing).toFixed(2)
        el.style.filter = facing > 0.96 ? 'none' : `blur(${((1 - facing) * 3).toFixed(2)}px)`
      }
      frontRef.current = front
    }

    applyTransform()

    let raf = 0
    let running = false
    let last = performance.now()

    const tick = (time: number) => {
      const delta = Math.min((time - last) / 1000, 1 / 30)
      last = time

      if (!dragRef.current) {
        if (targetY.current !== null) {
          const remaining = targetY.current - rotation.current.y
          rotation.current.y += remaining * Math.min(1, SNAP_RATE * delta)
          velocityY.current = 0
          if (Math.abs(remaining) < 0.05) rotation.current.y = targetY.current
        } else {
          const paused = pausedRef.current.hovered || pausedRef.current.focused
          const baseline = reducedMotion || paused ? 0 : AUTO_ROTATE_DEG_PER_SEC
          velocityY.current += (baseline - velocityY.current) * Math.min(1, RELAX_RATE * delta)
          rotation.current.y += velocityY.current * delta
        }
        applyTransform()
      }

      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Spin only while the dome is on screen.
    const visibility = new IntersectionObserver(([entry]) =>
      entry.isIntersecting ? start() : stop()
    )
    visibility.observe(root)

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      root.classList.add('is-interacted')
      targetY.current = null
      draggedRef.current = false
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastT: performance.now(),
        startRotX: rotation.current.x,
        startRotY: rotation.current.y,
        mouse: event.pointerType === 'mouse',
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
      // Vertical tilt is a mouse nicety; on touch, vertical movement scrolls the page.
      if (drag.mouse) {
        rotation.current.x = Math.min(MAX_TILT, Math.max(MIN_TILT, drag.startRotX - dyTotal * 0.22))
      }
      applyTransform()

      const now = performance.now()
      const dt = Math.max(now - drag.lastT, 1)
      const instantVelocity = ((event.clientX - drag.lastX) / dt) * 1000 * 0.32
      velocityY.current = Math.min(
        MAX_FLICK_DEG_PER_SEC,
        Math.max(-MAX_FLICK_DEG_PER_SEC, instantVelocity)
      )
      drag.lastX = event.clientX
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

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pausedRef.current.hovered = true
    }
    const handlePointerLeave = () => {
      pausedRef.current.hovered = false
    }

    root.addEventListener('pointerdown', handlePointerDown)
    root.addEventListener('pointermove', handlePointerMove)
    root.addEventListener('pointerup', endDrag)
    root.addEventListener('pointercancel', endDrag)
    root.addEventListener('pointerenter', handlePointerEnter)
    root.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      stop()
      visibility.disconnect()
      root.removeEventListener('pointerdown', handlePointerDown)
      root.removeEventListener('pointermove', handlePointerMove)
      root.removeEventListener('pointerup', endDrag)
      root.removeEventListener('pointercancel', endDrag)
      root.removeEventListener('pointerenter', handlePointerEnter)
      root.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [reducedMotion])

  /** Turns the ring one frame left (-1) or right (1) and announces what's in front. */
  const step = (direction: -1 | 1) => {
    const currentTiles = tilesRef.current
    const stepDeg = 360 / currentTiles.length
    const base = targetY.current ?? rotation.current.y
    // Snap to the nearest frame first, then move one step.
    const snapped = Math.round(base / stepDeg) * stepDeg
    const next = snapped - direction * stepDeg
    targetY.current = next
    const front = currentTiles.findIndex(
      (tile) => Math.abs(facingAngle(tile.rotateY, next)) < stepDeg / 2
    )
    setFrontIndex(front === -1 ? null : front)
    rootRef.current?.classList.add('is-interacted')
  }

  if (tiles.length === 0) {
    return null
  }

  const frontPhoto = frontIndex === null ? null : tiles[frontIndex].photo

  return (
    <div className="world-dome-block">
      {/* A focusable, labelled group whose arrow keys turn the ring (see aria-label). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
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
        aria-roledescription="rotating gallery"
        aria-label={`${world.name} photographs. Use the left and right arrow keys to turn the ring and Enter to open the photograph in front. Every frame is also listed below.`}
        // A focusable group: arrow keys turn it, Enter opens the front frame.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onFocus={(event) => {
          if (event.target !== event.currentTarget) return
          pausedRef.current.focused = true
          setFrontIndex(frontRef.current)
        }}
        onBlur={() => {
          pausedRef.current.focused = false
          targetY.current = null
          setFrontIndex(null)
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            step(event.key === 'ArrowLeft' ? -1 : 1)
          } else if ((event.key === 'Enter' || event.key === ' ') && frontIndex !== null) {
            event.preventDefault()
            void navigate({
              to: '/photos/$slug',
              params: { slug: tiles[frontIndex].photo.slug },
              state: originState,
            })
          }
        }}
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
              className={`world-dome__tile${index === frontIndex ? ' is-front' : ''}`}
              style={{ transform: `rotateY(${tile.rotateY}deg) rotateX(${tile.rotateX}deg)` }}
            >
              <Link
                ref={(el: HTMLAnchorElement | null) => {
                  frameRefs.current[index] = el
                }}
                to="/photos/$slug"
                params={{ slug: tile.photo.slug }}
                state={originState}
                aria-hidden="true"
                tabIndex={-1}
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
                    alt=""
                    preset="gallery"
                    sizes="220px"
                    lqip={tile.photo.image?.lqip}
                    palette={tile.photo.metadata.palette}
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
        <span aria-hidden="true" className="world-dome__hint">
          ‹ drag to turn ›
        </span>
        <p className="sr-only" aria-live="polite">
          {frontPhoto ? `In front: ${frontPhoto.title}. Press Enter to open.` : ''}
        </p>
      </div>
      <nav className="world-dome__index" aria-label={`Every frame in ${world.name}`}>
        {photos.map((photo, index) => (
          <Link
            key={photo.slug}
            to="/photos/$slug"
            params={{ slug: photo.slug }}
            state={originState}
            viewTransition
            className="world-dome__index-link no-underline"
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <span>{photo.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
