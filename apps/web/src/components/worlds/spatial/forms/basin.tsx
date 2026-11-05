import { noise2, smoothstep, taperToBase } from '../kit/contour'
import { Lens } from './structures/Lens'

import type { Board, WorldForm } from '../kit/types'

/**
 * Basin — a shallow bowl, read very close.
 *
 * Small Wonders is about scale, so this form breaks the set's scale on
 * purpose: the contour step is half the usual, the board is smaller, and the
 * camera comes in closer than anywhere else. The same machinery that made
 * Coast read as a coastline from a kilometre up makes this read as a hollow
 * you could hold — the terraces become the rings inside a shell, or the ridges
 * of a leaf, depending on how long you look.
 */

const board: Board = {
  span: 76,
  /* half the usual step: more, finer rings, which is what makes the same
     geometry read as something small rather than something far away */
  contourStep: 0.26,
  extent: { x: 0, z: 0, inner: 15, outer: 24, wobble: 0.34 },
  segments: { full: 460, lite: 250 },
}

const CENTRE = { x: 0.6, z: 1.4 }

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

function height(x: number, z: number): number {
  const fromCentre = Math.hypot(x - CENTRE.x, z - CENTRE.z)

  /* A raised rim falling into a hollow — the opposite of every other form
     here, which all build upward from their edges. */
  let h = 3.4 * smoothstep(19, 8.5, fromCentre)
  h -= 2.6 * smoothstep(9.5, 1.2, fromCentre)

  /* the specimen stands on a low island in the middle of the hollow */
  h += 1.5 * gauss(x, z, CENTRE.x, CENTRE.z, 2.2)

  /* Radiating ribs, so the rings are not concentric circles. Reading them as
     the veins of something is the point. */
  const angle = Math.atan2(z - CENTRE.z, x - CENTRE.x)
  h +=
    0.5 *
    Math.sin(angle * 7 + 0.6) *
    smoothstep(2.5, 12, fromCentre) *
    smoothstep(19, 10, fromCentre)

  /* an outer swell, so the bowl sits in something */
  h += 1.2 * gauss(x, z, -11, -9, 6.5)
  h += 0.9 * gauss(x, z, 12, 6, 6)

  h += 0.2 * noise2(x * 0.3, z * 0.3) * smoothstep(0.1, 1.2, h)

  return taperToBase(board, x, z, h)
}

export const basin: WorldForm = {
  id: 'basin',
  title: 'Basin — a shallow bowl and a lens',
  board,
  height,
  shoreMargin: 1.0,
  destination: CENTRE,
  base: 'water',

  /* down the inside of the bowl, spiralling in */
  route: [
    [-9.5, 15.5],
    [-7.5, 11.5],
    [-5.0, 8.0],
    [-2.4, 5.6],
    [0.4, 4.8],
    [2.4, 3.6],
    [CENTRE.x + 1.4, CENTRE.z + 0.6],
  ],

  camera: {
    desktop: [
      { at: 0.0, position: [20, 26, 46], look: [0, 0.5, 1] },
      { at: 0.24, position: [17, 22, 39], look: [0.2, 0.6, 1.2] },
      { at: 0.48, position: [14, 17, 30], look: [0.4, 0.8, 1.4] },
      { at: 0.68, position: [10.5, 12.5, 21], look: [0.6, 1.1, 1.4] },
      { at: 0.84, position: [8, 9.5, 15.5], look: [0.6, 1.3, 1.4] },
      { at: 0.93, position: [7.9, 9.4, 15.3], look: [0.6, 1.3, 1.4] },
      { at: 1.0, position: [13, 17, 27], look: [0.4, 1, 1.2] },
    ],
    mobile: [
      { at: 0.0, position: [23, 28, 40], look: [0.2, 0.6, 1.2] },
      { at: 0.24, position: [20, 24, 34], look: [0.3, 0.7, 1.3] },
      { at: 0.48, position: [16.5, 19.5, 27], look: [0.5, 0.9, 1.4] },
      { at: 0.68, position: [13, 15, 21], look: [0.6, 1.1, 1.4] },
      { at: 0.84, position: [10.5, 12, 17], look: [0.6, 1.3, 1.4] },
      { at: 0.93, position: [10.4, 11.9, 16.9], look: [0.6, 1.3, 1.4] },
      { at: 1.0, position: [15, 18, 25], look: [0.4, 1, 1.2] },
    ],
  },

  planting: [
    {
      kind: 'scrub',
      count: { full: 150, lite: 60 },
      seed: 8123,
      minHeight: 0.15,
      maxHeight: 3.6,
      maxSlope: 0.5,
      routeClearance: 0.7,
      destinationClearance: 2.6,
      clumping: 0.55,
      scaleRange: [0.4, 0.95],
    },
    {
      kind: 'round-tree',
      count: { full: 30, lite: 14 },
      seed: 313,
      minHeight: 1.2,
      maxHeight: 4.5,
      maxSlope: 0.28,
      routeClearance: 1.2,
      destinationClearance: 4.5,
      clumping: 0.8,
      scaleRange: [0.5, 0.85],
    },
    {
      kind: 'boulder',
      count: { full: 46, lite: 20 },
      seed: 5501,
      minHeight: -0.3,
      maxHeight: 2.0,
      maxSlope: 0.9,
      routeClearance: 0.7,
      destinationClearance: 2.4,
      radius: 20,
      scaleRange: [0.5, 1.5],
    },
  ],

  Destination: Lens,
}
