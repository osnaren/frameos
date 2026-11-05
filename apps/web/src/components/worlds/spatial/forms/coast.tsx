import * as THREE from 'three'

import { noise2, smoothstep, taperToBase } from '../kit/contour'
import { Lighthouse } from './structures/Lighthouse'
import { Waterfall } from './structures/Waterfall'

import type { Board, WorldForm } from '../kit/types'

/**
 * Coast — a headland with a lighthouse.
 *
 * A meandering waterline runs front-to-back through the board, so bays and
 * promontories are sculpted by bending that line rather than by modelling a
 * beach. The route descends from the high back of the island, crosses the
 * meadow terraces and ends on the promontory, where the lighthouse sends the
 * captured light back out.
 */

const board: Board = {
  span: 92,
  contourStep: 0.5,
  extent: { x: 1, z: -4, inner: 18, outer: 28, wobble: 0.31 },
  segments: { full: 480, lite: 260 },
}

const HEADLAND = { x: 7.6, z: 4.4 }
const PLATEAU = { x: -3.5, z: -15.5, radius: 5.4, height: 4.4 }
const FALLS = { x: 1.6, z: -17.5, footX: 3.0, footZ: -15.0 }

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

/**
 * Where the waterline sits for a given depth into the scene. The two sine
 * terms give the coast its bays and points; the noise keeps it from reading
 * as a drawn curve.
 */
function shoreAt(z: number) {
  return (
    3.0 +
    5.0 * Math.sin(z * 0.085 + 1.0) +
    2.2 * Math.sin(z * 0.21 - 0.6) +
    0.9 * noise2(z * 0.11, 4.2)
  )
}

/** Distance to the waterfall channel's centre line, and how far along it is. */
function fallsChannel(x: number, z: number) {
  const dx = FALLS.footX - FALLS.x
  const dz = FALLS.footZ - FALLS.z
  const lengthSq = dx * dx + dz * dz
  const t = THREE.MathUtils.clamp(((x - FALLS.x) * dx + (z - FALLS.z) * dz) / lengthSq, 0, 1)
  return { distance: Math.hypot(x - (FALLS.x + dx * t), z - (FALLS.z + dz * t)), t }
}

function height(x: number, z: number): number {
  const inland = shoreAt(z) - x

  if (inland <= 0) {
    /* seabed: a broad shelf close in, falling away steadily further out */
    const d = -inland
    return Math.max(-15, -(0.28 * d + 0.02 * d * d))
  }

  /* Rises slowly out of the water — which is what gives the beach its width —
     then climbs and saturates, so the far interior reads as rolling highland
     rather than an ever-climbing wall. */
  const rise = Math.pow(inland, 1.75) * 0.22
  let h = (6.6 * rise) / (rise + 7)

  /* --- cliff plateau at the back, its seaward lip over the water --- */
  const plateauMask = smoothstep(
    PLATEAU.radius + 2.8,
    PLATEAU.radius - 1.2,
    Math.hypot(x - PLATEAU.x, z - PLATEAU.z)
  )
  h =
    h * (1 - plateauMask) +
    (PLATEAU.height + 0.4 * noise2(x * 0.45 + 3, z * 0.45 - 2)) * plateauMask

  /* --- waterfall notch cut through the lip down into the water --- */
  const falls = fallsChannel(x, z)
  const notch = smoothstep(2.1, 0.4, falls.distance)
  if (notch > 0) {
    const floor = THREE.MathUtils.lerp(PLATEAU.height * 0.58, -0.6, smoothstep(0, 1, falls.t))
    h = h * (1 - notch) + Math.min(h, floor) * notch
  }

  /* --- the promontory: a shelf of land pushed out into the water --- */
  h += 2.1 * gauss(x, z, HEADLAND.x - 0.6, HEADLAND.z, 2.5)
  const pad = smoothstep(2.6, 1.0, Math.hypot(x - HEADLAND.x, z - HEADLAND.z))
  h = h * (1 - pad) + 1.7 * pad

  /* --- rolling interior, so the meadow is never a smooth ramp --- */
  h += 1.2 * gauss(x, z, -7, 1, 5.2)
  h += 0.5 * gauss(x, z, -6, 16, 4.6)
  h += 1.1 * gauss(x, z, -14, -3, 6.0)
  h -= 0.8 * gauss(x, z, 1.0, 1.5, 3.4) /* the hollow the route runs through */
  h -= 0.6 * gauss(x, z, 3.5, 9.0, 3.0) /* a dip behind the beach */

  /* --- beach: flatten low ground into a broad apron --- */
  const beachness = smoothstep(1.7, 0.1, h)
  h = h * (1 - beachness * 0.66) + 0.18 * beachness * 0.66

  /* --- surface detail, so the contours wander --- */
  const detail = 0.3 * noise2(x * 0.26, z * 0.26) + 0.08 * noise2(x * 0.62 + 9, z * 0.62 - 5)
  h += detail * smoothstep(0.1, 1.0, h) * (1 - plateauMask * 0.4)

  return taperToBase(board, x, z, h)
}

export const coast: WorldForm = {
  id: 'coast',
  title: 'Coast — headland and lighthouse',
  board,
  height,
  shoreAt,
  shoreMargin: 1.3,
  destination: HEADLAND,
  base: 'water',

  /* The path keeps to the seaward slope. Routed further inland it disappears
     behind the ridge line for most of the journey, which is exactly when the
     visitor most needs something to follow. */
  route: [
    [-4.0, -20.5],
    [-2.0, -16.0],
    [0.0, -11.5],
    [1.2, -7.0],
    [2.4, -3.2],
    [4.0, -0.4],
    [5.8, 2.2],
    [HEADLAND.x, HEADLAND.z],
  ],

  camera: {
    /* The camera never shows a horizon. Looking down onto the board is what
       tells the eye it is a made object on a table. Pitch holds at roughly
       26°; only the distance changes. */
    desktop: [
      { at: 0.0, position: [26, 34, 62], look: [2, 1, -1] },
      { at: 0.24, position: [24, 30, 54], look: [3, 1.5, 0] },
      { at: 0.48, position: [23, 25, 44], look: [4, 1.5, 2] },
      { at: 0.68, position: [19, 18, 33], look: [6, 1.8, 3.5] },
      { at: 0.84, position: [16, 13.5, 26], look: [7.3, 2, 4.4] },
      { at: 0.93, position: [16.1, 13.4, 25.8], look: [7.3, 2, 4.5] },
      { at: 1.0, position: [22, 22, 40], look: [5, 2, 1] },
    ],
    /* Portrait sees a far narrower slice, so it is aimed at the headland from
       the start and finishes further out than desktop. */
    mobile: [
      { at: 0.0, position: [34.4, 37, 53], look: [5, 2, 0] },
      { at: 0.24, position: [29.4, 30.5, 44.1], look: [5.5, 2, 1] },
      { at: 0.48, position: [25.3, 25, 36.8], look: [6, 2, 2] },
      { at: 0.68, position: [21.4, 20, 30.3], look: [6.3, 2, 3] },
      { at: 0.84, position: [18.7, 16.5, 25.5], look: [6.5, 2, 3.5] },
      { at: 0.93, position: [18.5, 16.3, 25.1], look: [6.5, 2, 3.6] },
      { at: 1.0, position: [23.5, 24.5, 33.3], look: [5, 2.5, 0] },
    ],
  },

  planting: [
    {
      kind: 'round-tree',
      count: { full: 54, lite: 26 },
      seed: 17,
      minHeight: 1.4,
      maxHeight: 9.5,
      maxSlope: 0.3,
      routeClearance: 1.4,
      destinationClearance: 6.5,
      clumping: 0.85,
      scaleRange: [0.75, 1.35],
    },
    {
      kind: 'cone-tree',
      count: { full: 40, lite: 20 },
      seed: 313,
      minHeight: 2.4,
      maxHeight: 11,
      maxSlope: 0.3,
      routeClearance: 1.4,
      destinationClearance: 6.5,
      clumping: 0.9,
      scaleRange: [0.7, 1.25],
    },
    {
      kind: 'scrub',
      count: { full: 90, lite: 40 },
      seed: 971,
      minHeight: 0.5,
      maxHeight: 9,
      maxSlope: 0.42,
      routeClearance: 0.85,
      destinationClearance: 3.6,
      clumping: 0.5,
      scaleRange: [0.6, 1.25],
    },
    {
      kind: 'boulder',
      count: { full: 34, lite: 16 },
      seed: 6101,
      minHeight: -0.4,
      maxHeight: 1.6,
      maxSlope: 0.9,
      routeClearance: 0.8,
      destinationClearance: 3.4,
      radius: 26,
      scaleRange: [1.1, 3.0],
    },
  ],

  Destination: Lighthouse,
  Scenery: Waterfall,
}
