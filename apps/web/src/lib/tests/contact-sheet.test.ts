import { describe, expect, it } from 'vitest'

import { findSheetNeighbour, isSheetKey } from '@/lib/contact-sheet'

// Two justified rows: a wide frame then two narrow ones; three narrow below.
const rects = [
  { left: 0, top: 0, width: 400, height: 200 },
  { left: 410, top: 0, width: 120, height: 200 },
  { left: 540, top: 0, width: 120, height: 200 },
  { left: 0, top: 210, width: 200, height: 260 },
  { left: 210, top: 210, width: 200, height: 260 },
  { left: 420, top: 210, width: 240, height: 260 },
]

describe('findSheetNeighbour', () => {
  it('moves linearly with left/right and stops at the ends', () => {
    expect(findSheetNeighbour(rects, 0, 'ArrowRight')).toBe(1)
    expect(findSheetNeighbour(rects, 0, 'ArrowLeft')).toBe(0)
    expect(findSheetNeighbour(rects, 5, 'ArrowRight')).toBe(5)
  })

  it('jumps to the visually closest frame in the next or previous row', () => {
    expect(findSheetNeighbour(rects, 0, 'ArrowDown')).toBe(3)
    expect(findSheetNeighbour(rects, 2, 'ArrowDown')).toBe(5)
    expect(findSheetNeighbour(rects, 4, 'ArrowUp')).toBe(0)
    expect(findSheetNeighbour(rects, 5, 'ArrowUp')).toBe(2)
  })

  it('stays put at the top and bottom rows', () => {
    expect(findSheetNeighbour(rects, 1, 'ArrowUp')).toBe(1)
    expect(findSheetNeighbour(rects, 4, 'ArrowDown')).toBe(4)
  })

  it('handles Home/End and empty sheets', () => {
    expect(findSheetNeighbour(rects, 3, 'Home')).toBe(0)
    expect(findSheetNeighbour(rects, 0, 'End')).toBe(5)
    expect(findSheetNeighbour([], 0, 'ArrowDown')).toBe(-1)
  })

  it('recognises only sheet navigation keys', () => {
    expect(isSheetKey('ArrowDown')).toBe(true)
    expect(isSheetKey('Enter')).toBe(false)
  })
})
