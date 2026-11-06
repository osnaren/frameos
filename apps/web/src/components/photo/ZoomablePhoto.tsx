import { useEffect, useRef, useState } from 'react'

import { ZoomIn, ZoomOut } from 'lucide-react'

import {
  IDENTITY_ZOOM,
  STEP_ZOOM,
  clampPan,
  resolveSwipe,
  zoomAround,
  type ZoomState,
} from '@/lib/gestures'
import { cn } from '@/lib/utils'

import { PhotoImage } from './PhotoImage'

import type { Photo } from '@/types/photo'

interface ZoomablePhotoProps {
  photo: Photo
  /** `sizes` at 1×; when zoomed the request scales up so the detail is real, not upscaled. */
  sizes: string
  zoom: ZoomState
  onZoomChange: (next: ZoomState) => void
  /** Called with 1 (next) or -1 (previous) when an un-zoomed horizontal swipe completes. */
  onSwipe?: (direction: -1 | 1) => void
  className?: string
  priority?: boolean
}

interface PointerPoint {
  x: number
  y: number
}

interface Gesture {
  startZoom: ZoomState
  startPoints: Map<number, PointerPoint>
  startTime: number
  startDistance: number
  startCentre: PointerPoint
  moved: boolean
}

const TAP_SLOP = 8
const DOUBLE_TAP_MS = 300

/** The visible zoom control that pairs with a ZoomablePhoto (pointer gestures aren't the only way in). */
export function ZoomToggle({
  zoom,
  onZoomChange,
  className,
}: {
  zoom: ZoomState
  onZoomChange: (next: ZoomState) => void
  className?: string
}) {
  const zoomed = zoom.scale > 1.001

  return (
    <button
      type="button"
      className={className}
      aria-pressed={zoomed}
      aria-keyshortcuts="+ - 0"
      onClick={() => onZoomChange(zoomed ? IDENTITY_ZOOM : { scale: STEP_ZOOM, x: 0, y: 0 })}
    >
      {zoomed ? <ZoomOut aria-hidden="true" /> : <ZoomIn aria-hidden="true" />}
      <span>{zoomed ? 'Fit to screen' : 'Zoom in'}</span>
    </button>
  )
}

function distance(a: PointerPoint, b: PointerPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function centre(points: PointerPoint[]): PointerPoint {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), {
    x: 0,
    y: 0,
  })
  return { x: total.x / points.length, y: total.y / points.length }
}

/**
 * A photograph you can inspect: double-click / double-tap or the zoom
 * controls to zoom at a point, pinch or ctrl/⌘-scroll (trackpad pinch) to
 * zoom smoothly, drag or scroll to pan while zoomed, and swipe sideways to
 * page while not. The frame reserves the photo's exact shape up front, so
 * nothing jumps while the file loads.
 */
export function ZoomablePhoto({
  photo,
  sizes,
  zoom,
  onZoomChange,
  onSwipe,
  className,
  priority = false,
}: ZoomablePhotoProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, PointerPoint>())
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef<{ time: number; point: PointerPoint } | null>(null)
  const lastPointerType = useRef('mouse')
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const [frameWidth, setFrameWidth] = useState(0)
  const [gesturing, setGesturing] = useState(false)
  const { width, height } = photo.metadata
  const ratio = width > 0 && height > 0 ? width / height : 1
  const zoomed = zoom.scale > 1.001

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width))
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const box = () => ({
    width: frameRef.current?.clientWidth ?? 0,
    height: frameRef.current?.clientHeight ?? 0,
  })

  /** Pointer position relative to the frame's centre. */
  const fromCentre = (clientX: number, clientY: number): PointerPoint => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) {
      return { x: 0, y: 0 }
    }
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 }
  }

  const toggleZoomAt = (point: PointerPoint) => {
    const current = zoomRef.current
    onZoomChange(
      current.scale > 1.001 ? IDENTITY_ZOOM : zoomAround(current, STEP_ZOOM, point, box())
    )
  }

  // Trackpad pinch arrives as ctrl+wheel; it must be cancelable so the
  // browser page itself doesn't zoom — hence a native, non-passive listener.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      const current = zoomRef.current
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const rect = frame.getBoundingClientRect()
        const point = {
          x: event.clientX - rect.left - rect.width / 2,
          y: event.clientY - rect.top - rect.height / 2,
        }
        onZoomChange(
          zoomAround(current, current.scale * Math.exp(-event.deltaY * 0.01), point, {
            width: rect.width,
            height: rect.height,
          })
        )
        return
      }

      if (current.scale > 1.001) {
        event.preventDefault()
        onZoomChange(
          clampPan(
            { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY },
            { width: frame.clientWidth, height: frame.clientHeight }
          )
        )
      }
    }

    frame.addEventListener('wheel', handleWheel, { passive: false })
    return () => frame.removeEventListener('wheel', handleWheel)
  }, [onZoomChange])

  const beginGesture = () => {
    const points = Array.from(pointers.current.values())
    gesture.current = {
      startZoom: zoomRef.current,
      startPoints: new Map(pointers.current),
      startTime: performance.now(),
      startDistance: points.length >= 2 ? distance(points[0], points[1]) : 0,
      startCentre: centre(points),
      moved: gesture.current?.moved ?? false,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    lastPointerType.current = event.pointerType
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, fromCentre(event.clientX, event.clientY))
    if (pointers.current.size === 1) {
      gesture.current = null
    }
    beginGesture()
    setGesturing(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current
    if (!active || !pointers.current.has(event.pointerId)) {
      return
    }

    pointers.current.set(event.pointerId, fromCentre(event.clientX, event.clientY))
    const points = Array.from(pointers.current.values())
    const start = active.startPoints.get(event.pointerId)

    const latest = pointers.current.get(event.pointerId)

    if (start && latest && distance(start, latest) > TAP_SLOP) {
      active.moved = true
    }

    if (points.length >= 2 && active.startDistance > 0) {
      const current = centre(points)
      const scaled = zoomAround(
        active.startZoom,
        active.startZoom.scale * (distance(points[0], points[1]) / active.startDistance),
        active.startCentre,
        box()
      )
      onZoomChange(
        clampPan(
          {
            ...scaled,
            x: scaled.x + current.x - active.startCentre.x,
            y: scaled.y + current.y - active.startCentre.y,
          },
          box()
        )
      )
      return
    }

    const dx = points[0].x - active.startCentre.x
    const dy = points[0].y - active.startCentre.y

    if (active.startZoom.scale > 1.001) {
      onZoomChange(
        clampPan(
          { ...active.startZoom, x: active.startZoom.x + dx, y: active.startZoom.y + dy },
          box()
        )
      )
    } else if (onSwipe && canvasRef.current) {
      // A little rubber-band follow so the swipe feels physical.
      canvasRef.current.style.translate = `${dx * 0.35}px 0`
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current
    const point = pointers.current.get(event.pointerId)
    pointers.current.delete(event.pointerId)

    if (canvasRef.current) {
      canvasRef.current.style.translate = ''
    }

    if (!active || !point) {
      return
    }

    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: continue as a pan from here.
      beginGesture()
      return
    }

    setGesturing(false)
    gesture.current = null
    const elapsed = performance.now() - active.startTime
    const startPoint = active.startPoints.get(event.pointerId)

    if (!active.moved && event.pointerType !== 'mouse' && event.type === 'pointerup') {
      const now = performance.now()
      const previous = lastTap.current
      if (previous && now - previous.time < DOUBLE_TAP_MS && distance(previous.point, point) < 30) {
        lastTap.current = null
        toggleZoomAt(point)
      } else {
        lastTap.current = { time: now, point }
      }
      return
    }

    if (
      onSwipe &&
      startPoint &&
      active.startZoom.scale <= 1.001 &&
      active.startPoints.size === 1 &&
      event.type === 'pointerup'
    ) {
      const dx = point.x - startPoint.x
      const direction = resolveSwipe({
        dx,
        dy: point.y - startPoint.y,
        velocityX: (dx / Math.max(elapsed, 1)) * 1000,
      })
      if (direction !== 0) {
        onSwipe(direction)
      }
    }
  }

  const zoomedSizes = zoomed && frameWidth > 0 ? `${Math.ceil(frameWidth * zoom.scale)}px` : sizes

  return (
    <div
      ref={frameRef}
      className={cn(
        'zoomable-photo',
        zoomed && 'is-zoomed',
        gesturing && 'is-gesturing',
        className
      )}
      style={{ '--photo-ratio': ratio } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(event) => {
        // Touch double-taps are handled above; some browsers also synthesise a dblclick.
        if (lastPointerType.current === 'mouse') {
          toggleZoomAt(fromCentre(event.clientX, event.clientY))
        }
      }}
    >
      <div
        ref={canvasRef}
        className="zoomable-photo__canvas"
        style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
      >
        <PhotoImage
          publicId={photo.publicId}
          alt={photo.alt}
          preset="detail"
          sizes={zoomedSizes}
          priority={priority}
          intrinsicWidth={width || undefined}
          intrinsicHeight={height || undefined}
          lqip={photo.image?.lqip}
          palette={photo.metadata.palette}
          hotspot={photo.image?.hotspot}
          className="zoomable-photo__image"
        />
      </div>
    </div>
  )
}
