import { describe, expect, it } from 'vitest'

import {
  IDENTITY_ZOOM,
  MAX_ZOOM,
  clampPan,
  clampScale,
  resolveSwipe,
  zoomAround,
  zoomFromKey,
} from '@/lib/gestures'

describe('resolveSwipe', () => {
  it('pages forward on a deliberate leftward drag and back on a rightward one', () => {
    expect(resolveSwipe({ dx: -90, dy: 4 })).toBe(1)
    expect(resolveSwipe({ dx: 90, dy: -6 })).toBe(-1)
  })

  it('accepts a short, quick flick in the same direction', () => {
    expect(resolveSwipe({ dx: -30, dy: 0, velocityX: -900 })).toBe(1)
    expect(resolveSwipe({ dx: -30, dy: 0, velocityX: 900 })).toBe(0)
  })

  it('ignores short drags and mostly-vertical movement (that is scrolling)', () => {
    expect(resolveSwipe({ dx: -20, dy: 0 })).toBe(0)
    expect(resolveSwipe({ dx: -80, dy: 120 })).toBe(0)
    expect(resolveSwipe({ dx: 0, dy: 0 })).toBe(0)
  })
})

describe('zoom maths', () => {
  const box = { width: 400, height: 300 }

  it('clamps the zoom level', () => {
    expect(clampScale(0.2)).toBe(1)
    expect(clampScale(12)).toBe(MAX_ZOOM)
    expect(clampScale(Number.NaN)).toBe(1)
  })

  it('never pans past the frame edge, and recentres at 1x', () => {
    expect(clampPan({ scale: 2, x: 999, y: -999 }, box)).toEqual({ scale: 2, x: 200, y: -150 })
    expect(clampPan({ scale: 1, x: 40, y: 40 }, box)).toEqual(IDENTITY_ZOOM)
  })

  it('keeps the focus point still while zooming in', () => {
    const focus = { x: 100, y: 50 }
    const zoomed = zoomAround(IDENTITY_ZOOM, 2, focus, box)

    // The content point under the focus before zooming is still under it after.
    const contentX = (focus.x - IDENTITY_ZOOM.x) / IDENTITY_ZOOM.scale
    expect(zoomed.x + zoomed.scale * contentX).toBeCloseTo(focus.x)
    expect(zoomed).toEqual({ scale: 2, x: -100, y: -50 })
  })

  it('returns to identity when zooming back out to 1x', () => {
    expect(zoomAround({ scale: 3, x: 120, y: -40 }, 1, { x: 0, y: 0 }, box)).toEqual(IDENTITY_ZOOM)
  })

  it('maps keyboard shortcuts to zoom steps', () => {
    expect(zoomFromKey('+', IDENTITY_ZOOM, box)).toEqual({ scale: 1.5, x: 0, y: 0 })
    expect(zoomFromKey('-', { scale: 1.5, x: 0, y: 0 }, box)).toEqual(IDENTITY_ZOOM)
    expect(zoomFromKey('0', { scale: 3, x: 50, y: 20 }, box)).toEqual(IDENTITY_ZOOM)
    expect(zoomFromKey('ArrowLeft', IDENTITY_ZOOM, box)).toBeNull()
  })
})
