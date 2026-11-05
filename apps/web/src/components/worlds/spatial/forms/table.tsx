import { noise2, smoothstep, taperToBase } from '../kit/contour'
import { Setting } from './structures/Setting'

import type { Board, WorldForm } from '../kit/types'

/**
 * Table — a cloth, and a place laid on it.
 *
 * The joke this world is built on: at model scale, a set table read from
 * above *is* a landscape. So it uses the same contour builder as the coast,
 * and what comes out is the fall of a cloth over a table edge — long soft
 * folds instead of ridges, a rucked corner instead of a cliff. The base is
 * dry rather than water, which is the one switch that stops it reading as an
 * island.
 */

const board: Board = {
  span: 84,
  contourStep: 0.22,
  extent: { x: 0, z: 0, inner: 16, outer: 25, wobble: 0.16 },
  segments: { full: 440, lite: 240 },
}

const PLACE = { x: 0.8, z: 1.2 }

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

function height(x: number, z: number): number {
  /* The table top: a broad, almost flat plateau with a soft rounded edge —
     the cloth breaking over it rather than a cut. */
  const fromCentre = Math.hypot(x * 0.92, z)
  let h = 3.2 * smoothstep(16.5, 11.0, fromCentre)

  /* the fall of the cloth: long folds running down the overhang */
  const angle = Math.atan2(z, x)
  const overhang = smoothstep(11.0, 16.5, fromCentre) * smoothstep(19.5, 15.0, fromCentre)
  h += 0.55 * Math.sin(angle * 9 + 0.4) * overhang
  h += 0.3 * Math.sin(angle * 17 - 1.2) * overhang

  /* a rucked corner, where something was pushed across */
  h += 0.7 * gauss(x, z, -7.5, 6.5, 3.2) * smoothstep(0.4, 2.2, h)
  h -= 0.45 * gauss(x, z, 6.0, -6.5, 2.6) * smoothstep(0.4, 2.2, h)

  /* the low weave of the cloth itself */
  h += 0.16 * noise2(x * 0.42, z * 0.42) * smoothstep(0.2, 1.4, h)
  h += 0.06 * noise2(x * 1.1 + 3, z * 1.1 - 2) * smoothstep(0.2, 1.4, h)

  return taperToBase(board, x, z, h)
}

export const table: WorldForm = {
  id: 'table',
  title: 'Table — a cloth and a place laid',
  board,
  height,
  shoreMargin: 1.0,
  destination: PLACE,
  base: 'dry',

  /* across the cloth to the place setting */
  route: [
    [-13.0, 12.5],
    [-10.0, 10.0],
    [-6.6, 8.0],
    [-3.4, 6.2],
    [-1.0, 4.4],
    [0.2, 3.0],
    [PLACE.x, PLACE.z + 1.0],
  ],

  camera: {
    desktop: [
      { at: 0.0, position: [20, 26, 46], look: [0, 1.6, 1] },
      { at: 0.24, position: [18, 23, 40], look: [0.3, 1.8, 1.2] },
      { at: 0.48, position: [15.5, 19, 32], look: [0.6, 2, 1.4] },
      { at: 0.68, position: [12, 14.5, 23], look: [0.8, 2.4, 1.4] },
      { at: 0.84, position: [9.5, 11.5, 18], look: [0.8, 2.7, 1.3] },
      { at: 0.93, position: [9.4, 11.4, 17.9], look: [0.8, 2.7, 1.3] },
      { at: 1.0, position: [14, 18, 29], look: [0.6, 2.2, 1] },
    ],
    mobile: [
      { at: 0.0, position: [23, 28, 40], look: [0.3, 1.8, 1.2] },
      { at: 0.24, position: [21, 25, 35], look: [0.4, 1.9, 1.3] },
      { at: 0.48, position: [18, 21, 29], look: [0.6, 2.1, 1.4] },
      { at: 0.68, position: [14.5, 17, 23], look: [0.8, 2.4, 1.4] },
      { at: 0.84, position: [12, 14, 19], look: [0.8, 2.7, 1.3] },
      { at: 0.93, position: [11.9, 13.9, 18.9], look: [0.8, 2.7, 1.3] },
      { at: 1.0, position: [16, 20, 27], look: [0.6, 2.2, 1] },
    ],
  },

  /* Linen and wood, not earth. */
  tones: {
    low: '#e3d9c6',
    mid: '#d9cdb4',
    high: '#e8e0d0',
    cut: '#c6b79c',
    cutDeep: '#9a8a70',
    built: '#c8ab84',
  },

  planting: [
    /* Nothing grows on a table. What is scattered here is crumbs, cutlery
       and the small things a meal leaves behind. */
    {
      kind: 'boulder',
      count: { full: 90, lite: 38 },
      seed: 1201,
      minHeight: 0.4,
      maxHeight: 3.6,
      maxSlope: 0.3,
      routeClearance: 0.8,
      destinationClearance: 3.2,
      radius: 15,
      scaleRange: [0.2, 0.7],
    },
    {
      kind: 'post',
      count: { full: 14, lite: 6 },
      seed: 4409,
      minHeight: 2.4,
      maxHeight: 3.6,
      maxSlope: 0.16,
      routeClearance: 1.4,
      destinationClearance: 4.2,
      radius: 11,
      scaleRange: [0.5, 0.8],
    },
  ],

  Destination: Setting,
}
