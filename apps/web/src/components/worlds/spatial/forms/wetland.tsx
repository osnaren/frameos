import { noise2, smoothstep, taperToBase } from '../kit/contour'
import { Hide } from './structures/Hide'

import type { Board, WorldForm } from '../kit/types'

/**
 * Wetland — braided channels, and somewhere to wait.
 *
 * Living Things is the flattest form in the set. Almost nothing rises: the
 * land barely clears the water, and what shape there is comes from channels
 * cut *through* it rather than ground built up. The contours become the
 * margins of pools, so the same builder that cut cliffs elsewhere here draws
 * a map of standing water — and the hide is the only thing with any height.
 */

const board: Board = {
  span: 92,
  contourStep: 0.3,
  extent: { x: 0, z: -2, inner: 19, outer: 29, wobble: 0.36 },
  segments: { full: 460, lite: 250 },
}

const HIDE = { x: 5.2, z: 2.6 }

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

/** A channel: distance to a wandering line running across the marsh. */
function channel(x: number, z: number, phase: number, drift: number) {
  const centre = drift + 5.5 * Math.sin(z * 0.11 + phase) + 2.2 * Math.sin(z * 0.26 - phase)
  return Math.abs(x - centre)
}

function height(x: number, z: number): number {
  /* a very shallow dome — the whole marsh is barely above the water */
  const fromCentre = Math.hypot(x, z + 2)
  let h = 1.5 * smoothstep(24, 6, fromCentre) + 0.5 * smoothstep(28, 14, fromCentre)

  /* two braided channels cut through it, and a wider pool where they meet */
  h -= 1.6 * smoothstep(3.4, 0.4, channel(x, z, 0.4, -4))
  h -= 1.4 * smoothstep(3.0, 0.4, channel(x, z, 2.7, 7))
  h -= 1.3 * gauss(x, z, 0.5, -9, 4.2)

  /* a couple of drier hummocks, so there is somewhere for anything to stand */
  h += 0.9 * gauss(x, z, -8, 6, 3.4)
  h += 0.8 * gauss(x, z, 9, -4, 3.0)
  /* the bank the hide is built out from */
  h += 1.0 * gauss(x, z, HIDE.x + 1.5, HIDE.z + 4.5, 3.2)

  /* At this flatness the contour lines are the whole read, so the surface
     detail matters more here than anywhere else. */
  h += 0.22 * noise2(x * 0.22, z * 0.22)
  h += 0.09 * noise2(x * 0.6 + 5, z * 0.6 - 3)

  return taperToBase(board, x, z, h)
}

export const wetland: WorldForm = {
  id: 'wetland',
  title: 'Wetland — braided channels and a hide',
  board,
  height,
  shoreMargin: 0.9,
  destination: HIDE,
  base: 'water',

  /* Along the drier ground, then out onto the boardwalk. The last waypoint
     sits where the walk meets the hut, so the light actually arrives rather
     than stopping in the marsh short of it. */
  route: [
    [-11.0, 17.0],
    [-8.0, 13.5],
    [-4.6, 11.0],
    [-1.0, 9.4],
    [2.0, 8.0],
    [4.2, 5.4],
    [HIDE.x, HIDE.z + 1.6],
  ],

  camera: {
    /* The marsh is wide and almost flat, so it needs distance to read at all
       — close in, the channels stop being a map and become a hillside. */
    desktop: [
      { at: 0.0, position: [25, 36, 57], look: [0, 1, 2] },
      { at: 0.24, position: [22.6, 31, 49.8], look: [1, 1, 2.4] },
      { at: 0.48, position: [19.8, 25.2, 40.7], look: [2.5, 1.2, 2.8] },
      { at: 0.68, position: [17.7, 20.3, 33], look: [4, 1.3, 3] },
      { at: 0.84, position: [16.5, 17.4, 28.2], look: [5, 1.4, 2.9] },
      { at: 0.93, position: [16.4, 17.3, 28], look: [5, 1.4, 3] },
      { at: 1.0, position: [21.7, 27.2, 43.1], look: [3, 1.2, 2] },
    ],
    mobile: [
      { at: 0.0, position: [28.8, 41, 65.2], look: [0, 1, 2] },
      { at: 0.24, position: [26.2, 36, 57.3], look: [1, 1, 2.4] },
      { at: 0.48, position: [23.4, 30.2, 48.6], look: [2.5, 1.2, 2.8] },
      { at: 0.68, position: [20.6, 24.3, 39.3], look: [4, 1.3, 3] },
      { at: 0.84, position: [18.7, 20.4, 32.9], look: [5, 1.4, 2.9] },
      { at: 0.93, position: [18.6, 20.3, 32.7], look: [5, 1.4, 3] },
      { at: 1.0, position: [24.6, 31.2, 49.4], look: [3, 1.2, 2] },
    ],
  },

  planting: [
    {
      kind: 'reed',
      count: { full: 260, lite: 100 },
      seed: 613,
      minHeight: 0.05,
      maxHeight: 1.1,
      maxSlope: 0.5,
      routeClearance: 0.7,
      destinationClearance: 3.0,
      clumping: 0.7,
      scaleRange: [0.6, 1.4],
    },
    {
      kind: 'scrub',
      count: { full: 110, lite: 46 },
      seed: 977,
      minHeight: 0.5,
      maxHeight: 2.6,
      maxSlope: 0.42,
      routeClearance: 0.9,
      destinationClearance: 3.2,
      clumping: 0.6,
      scaleRange: [0.55, 1.1],
    },
    {
      kind: 'round-tree',
      count: { full: 26, lite: 12 },
      seed: 1451,
      minHeight: 1.2,
      maxHeight: 3.6,
      maxSlope: 0.24,
      routeClearance: 1.6,
      destinationClearance: 6.0,
      clumping: 0.9,
      scaleRange: [0.7, 1.2],
    },
    {
      kind: 'post',
      count: { full: 18, lite: 8 },
      seed: 3301,
      minHeight: -0.2,
      maxHeight: 0.8,
      maxSlope: 0.9,
      routeClearance: 1.0,
      destinationClearance: 3.0,
      radius: 22,
      scaleRange: [0.7, 1.1],
    },
  ],

  Destination: Hide,
}
