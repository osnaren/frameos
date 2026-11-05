import { noise2, smoothstep, taperToBase } from '../kit/contour'
import { Temple } from './structures/Temple'

import type { Board, WorldForm } from '../kit/types'

/**
 * Plateau — a stepped mesa, cut for a temple.
 *
 * Where Coast is a landform with a building on it, this is a landform that
 * has been *worked*: broad terraces cut into a mesa, a processional ramp on
 * one side, and a quarried notch on the other. The contour steps stop being
 * an abstraction of a hillside and start reading as courses of stone, which
 * is the whole reason this world uses the same machinery to a different end.
 */

const board: Board = {
  span: 92,
  contourStep: 0.62,
  extent: { x: 0, z: -2, inner: 13, outer: 21, wobble: 0.26 },
  segments: { full: 460, lite: 250 },
}

const SUMMIT = { x: 1.5, z: 1.0 }

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

function height(x: number, z: number): number {
  const fromCentre = Math.hypot(x - SUMMIT.x, z - SUMMIT.z)

  /* The mesa: a broad flat crown with steep flanks. A gaussian would give a
     dome, so this is a plateau profile — flat until the rim, then away. */
  let h = 5.4 * smoothstep(10.5, 3.8, fromCentre)

  /* Two lower aprons, so the mesa sits on something rather than rising out
     of nothing. */
  h += 1.8 * smoothstep(17, 9, fromCentre)
  h += 1.1 * gauss(x, z, -7, -8, 5)
  h += 0.9 * gauss(x, z, 8, -6, 4.5)

  /* The processional ramp: a wedge cut up the south face, wide at the bottom
     and narrowing as it climbs, which is what the route follows. */
  const rampWidth = 2.2 + Math.max(0, z - 1) * 0.14
  const onRamp = smoothstep(rampWidth, rampWidth - 1.6, Math.abs(x - SUMMIT.x - 0.4))
  const ramping = onRamp * smoothstep(15, 4.0, z) * smoothstep(2.0, 4.5, z)
  if (ramping > 0) {
    const climb = 5.4 * smoothstep(14, 4.2, z)
    h = h * (1 - ramping) + Math.max(h, climb) * ramping
  }

  /* A quarried notch out of the north-west rim, so the crown is not a disc. */
  const notch = smoothstep(4.0, 1.7, Math.hypot(x + 4.6, z + 5.8))
  h -= 2.4 * notch

  /* Courses wander: without this the contours come out as perfect rings. */
  h += 0.34 * noise2(x * 0.2, z * 0.2) * smoothstep(0.2, 2, h)
  h += 0.12 * noise2(x * 0.55 + 4, z * 0.55 - 6) * smoothstep(0.2, 2, h)

  return taperToBase(board, x, z, h)
}

export const plateau: WorldForm = {
  id: 'plateau',
  title: 'Plateau — a stepped mesa and a temple',
  board,
  height,
  shoreMargin: 1.2,
  destination: SUMMIT,
  base: 'dry',

  /* up the processional ramp, then onto the crown */
  route: [
    [3.0, 15.0],
    [2.7, 12.0],
    [2.5, 9.0],
    [2.3, 6.4],
    [2.1, 4.2],
    [1.9, 2.6],
    [SUMMIT.x, SUMMIT.z + 1.0],
  ],

  camera: {
    /* The mesa is the largest form in the set — roughly 46 units across with
       its aprons — so every distance here is far longer than the coast's. */
    desktop: [
      /* The look target climbs as the camera closes: the crown sits at about
         y=7 and the temple stands 3.5 above that, so aiming at the ground
         would leave the destination riding the top edge of the frame. */
      { at: 0.0, position: [22.7, 34.5, 46.6], look: [1.5, 5, 0] },
      { at: 0.24, position: [19.5, 30, 40.5], look: [1.5, 5.5, 0.4] },
      { at: 0.48, position: [16.3, 25.5, 33.4], look: [1.5, 6.2, 0.7] },
      { at: 0.68, position: [13.4, 23, 27.1], look: [1.5, 7.4, 1] },
      { at: 0.84, position: [11.4, 22.6, 22.7], look: [1.5, 8.8, 1] },
      { at: 0.93, position: [11.3, 22.4, 22.5], look: [1.5, 8.8, 1.1] },
      { at: 1.0, position: [17.3, 28, 35.3], look: [1.5, 6, 0.5] },
    ],
    mobile: [
      { at: 0.0, position: [20.2, 31, 41], look: [1.5, 5, 0] },
      { at: 0.24, position: [17.7, 27.5, 36], look: [1.5, 5.5, 0.4] },
      { at: 0.48, position: [14.8, 24, 30], look: [1.5, 6.2, 0.7] },
      { at: 0.68, position: [11.9, 21, 24], look: [1.5, 7.4, 1] },
      { at: 0.84, position: [10.1, 20.5, 20], look: [1.5, 8.5, 1] },
      { at: 0.93, position: [10, 20.3, 19.8], look: [1.5, 8.5, 1.1] },
      { at: 1.0, position: [15.9, 26, 32.1], look: [1.5, 6, 0.5] },
    ],
  },

  /* Stone, not meadow — so the wash is quarried rather than grown. */
  tones: {
    low: '#d8cdb8',
    mid: '#c2b7a4',
    high: '#cdc6b6',
    cut: '#ada492',
    cutDeep: '#847b6c',
    built: '#cfc4ae',
  },

  planting: [
    /* almost nothing grows here: a few posts marking the way, and rubble */
    {
      kind: 'post',
      count: { full: 26, lite: 12 },
      seed: 41,
      minHeight: 0.6,
      maxHeight: 8,
      maxSlope: 0.24,
      routeClearance: 1.0,
      destinationClearance: 5.0,
      scaleRange: [0.8, 1.2],
    },
    {
      kind: 'boulder',
      count: { full: 70, lite: 30 },
      seed: 7717,
      minHeight: 0.2,
      maxHeight: 8.5,
      maxSlope: 0.95,
      routeClearance: 1.1,
      destinationClearance: 4.4,
      radius: 24,
      scaleRange: [0.7, 2.4],
    },
    {
      kind: 'scrub',
      count: { full: 44, lite: 20 },
      seed: 2203,
      minHeight: 0.3,
      maxHeight: 3.4,
      maxSlope: 0.4,
      routeClearance: 1.0,
      destinationClearance: 4.0,
      clumping: 0.6,
      scaleRange: [0.5, 1.0],
    },
  ],

  Destination: Temple,
}
