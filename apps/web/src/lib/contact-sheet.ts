/**
 * Keyboard movement across the Index's justified contact sheet.
 *
 * Rows are produced by flex-wrap, so "the frame below" isn't index + n: it's
 * whichever frame in the next visual row sits closest to the current one
 * horizontally. Positions come from the live layout (getBoundingClientRect),
 * which keeps this correct at every viewport width.
 */
export interface TileRect {
  left: number
  top: number
  width: number
  height: number
}

export type SheetKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'

export const SHEET_KEYS: readonly SheetKey[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]

export function isSheetKey(key: string): key is SheetKey {
  return (SHEET_KEYS as readonly string[]).includes(key)
}

/** Tiles whose tops differ by less than this share a row. */
const ROW_TOLERANCE = 4

/** The index to focus next, or the current index when there's nowhere to go. */
export function findSheetNeighbour(rects: readonly TileRect[], index: number, key: SheetKey) {
  const last = rects.length - 1

  if (last < 0) {
    return -1
  }

  const current = Math.min(Math.max(index, 0), last)

  switch (key) {
    case 'Home':
      return 0
    case 'End':
      return last
    case 'ArrowLeft':
      return Math.max(0, current - 1)
    case 'ArrowRight':
      return Math.min(last, current + 1)
  }

  const from = rects[current]
  const centreX = from.left + from.width / 2
  const goingDown = key === 'ArrowDown'
  const rowTops = rects
    .map((rect) => rect.top)
    .filter((top) => (goingDown ? top > from.top + ROW_TOLERANCE : top < from.top - ROW_TOLERANCE))

  if (rowTops.length === 0) {
    return current
  }

  const targetTop = goingDown ? Math.min(...rowTops) : Math.max(...rowTops)
  let best = current
  let bestDistance = Number.POSITIVE_INFINITY

  rects.forEach((rect, candidate) => {
    if (Math.abs(rect.top - targetTop) > ROW_TOLERANCE) {
      return
    }

    const distance = Math.abs(rect.left + rect.width / 2 - centreX)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  })

  return best
}
