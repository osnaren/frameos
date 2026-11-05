/**
 * Gesture maths shared by the photo viewer and the Index lightbox: when a
 * horizontal drag counts as a swipe, and how pinch/double-tap zoom keeps the
 * point under your finger still while never letting the photo leave its frame.
 */

/** A deliberate drag this far always pages, regardless of speed. */
export const SWIPE_DISTANCE = 64
/** A shorter drag still pages if it's a quick flick in the same direction. */
export const SWIPE_FLICK_DISTANCE = 24
/** px/s */
export const SWIPE_FLICK_VELOCITY = 480

export interface SwipeInput {
  /** Horizontal travel in px (negative = finger moved left). */
  dx: number
  /** Vertical travel in px. */
  dy: number
  /** Horizontal release velocity in px/s. */
  velocityX?: number
}

/**
 * 1 = advance (the finger moved left, pulling the next frame in), -1 = go
 * back, 0 = not a swipe (too short, too slow, or mostly vertical — that's the
 * visitor scrolling the page, not paging).
 */
export function resolveSwipe({ dx, dy, velocityX = 0 }: SwipeInput): -1 | 0 | 1 {
  const distance = Math.abs(dx)

  if (distance === 0 || Math.abs(dy) > distance * 0.75) {
    return 0
  }

  const deliberate = distance >= SWIPE_DISTANCE
  const flick =
    distance >= SWIPE_FLICK_DISTANCE &&
    Math.abs(velocityX) >= SWIPE_FLICK_VELOCITY &&
    Math.sign(velocityX) === Math.sign(dx)

  if (!deliberate && !flick) {
    return 0
  }

  return dx < 0 ? 1 : -1
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
/** The level a double-click / double-tap / the zoom button jumps to. */
export const STEP_ZOOM = 2.5

/**
 * Applied as `translate(x, y) scale(scale)` with `transform-origin: center`,
 * so (x, y) is the offset of the photo's centre from the frame's centre.
 */
export interface ZoomState {
  scale: number
  x: number
  y: number
}

export interface Box {
  width: number
  height: number
}

export const IDENTITY_ZOOM: ZoomState = { scale: 1, x: 0, y: 0 }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampScale(scale: number) {
  return clamp(Number.isFinite(scale) ? scale : MIN_ZOOM, MIN_ZOOM, MAX_ZOOM)
}

/** Keeps a zoomed photo covering its frame: you can pan to any edge, never past it. */
export function clampPan(state: ZoomState, box: Box): ZoomState {
  const scale = clampScale(state.scale)

  if (scale === MIN_ZOOM) {
    return IDENTITY_ZOOM
  }

  const maxX = (box.width * (scale - 1)) / 2
  const maxY = (box.height * (scale - 1)) / 2

  return { scale, x: clamp(state.x, -maxX, maxX), y: clamp(state.y, -maxY, maxY) }
}

/**
 * Keyboard zoom: `+`/`=` in, `-` out (both around the current view's
 * centre), `0` back to fit. Returns null for any other key.
 */
export function zoomFromKey(key: string, state: ZoomState, box: Box): ZoomState | null {
  switch (key) {
    case '+':
    case '=':
      return zoomAround(state, state.scale * 1.5, { x: 0, y: 0 }, box)
    case '-':
    case '_':
      return zoomAround(state, state.scale / 1.5, { x: 0, y: 0 }, box)
    case '0':
      return IDENTITY_ZOOM
    default:
      return null
  }
}

/**
 * Zooms to `nextScale` so that the point under `focus` (px, measured from the
 * frame's centre) stays exactly where it is on screen.
 */
export function zoomAround(
  state: ZoomState,
  nextScale: number,
  focus: { x: number; y: number },
  box: Box
): ZoomState {
  const scale = clampScale(nextScale)
  const ratio = scale / state.scale

  return clampPan(
    {
      scale,
      x: focus.x - ratio * (focus.x - state.x),
      y: focus.y - ratio * (focus.y - state.y),
    },
    box
  )
}
