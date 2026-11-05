import type { GroundTones } from './palette'
import type { ComponentType } from 'react'

/**
 * The contract every Pocket World scene is built to.
 *
 * A world is a *form* plus a palette. The palette comes from the CMS — each
 * world document carries a three-tone `mood`, so recolouring a world is an
 * edit, not a deploy. The form is a module in `spatial/forms`, registered by
 * name, and a world document names the one it uses.
 *
 * That split is the whole point: adding a world that reuses an existing
 * landform is a CMS entry and nothing else. A world that needs a genuinely
 * new design is one new form module and one line in the registry — the
 * terrain builder, the water, the route, the planting, the camera rig, the
 * lighting, the finishing pass and the DOM shell are all shared and never
 * touched.
 */

export type Quality = 'full' | 'lite'

/** Mutable per-frame state, shared by reference across a world's scene. */
export interface WorldProgress {
  /** Raw scroll fraction through the journey container, 0..1 */
  scroll: number
  /** Damped camera-spline parameter */
  camT: number
  /** How far the light route is lit, 0..1 */
  routeHead: number
  /** 0..1 — how settled the visitor is at the destination */
  arrival: number
  /** The destination is under the pointer or has keyboard focus */
  destinationHovered: boolean
  /** World distance the lens is focused at — drives depth of field */
  focusDistance: number
  /** 0..1 progress of the entry flight into the collection */
  flyProgress: number
  flying: boolean
}

export interface CameraKey {
  /** Scroll fraction this key is anchored to. */
  at: number
  position: [number, number, number]
  look: [number, number, number]
}

/** How big the board is, and how the land is cut. */
export interface Board {
  /** Side length of the terrain mesh, in world units. */
  span: number
  /** Height of one contour step. Everything that stands on the ground is
   *  sized against this, so the model stays in register with itself. */
  contourStep: number
  /** Where the land tapers out into the poured base. */
  extent: { x: number; z: number; inner: number; outer: number; wobble: number }
  /** Mesh resolution. Must stay dense relative to `contourStep`, or the cut
   *  faces smear into ramps instead of reading as cut card. */
  segments: { full: number; lite: number }
}

/** One species of scattered dressing. */
export interface Planting {
  kind: 'round-tree' | 'cone-tree' | 'scrub' | 'boulder' | 'reed' | 'post'
  count: { full: number; lite: number }
  seed: number
  minHeight: number
  maxHeight: number
  maxSlope: number
  routeClearance: number
  destinationClearance: number
  clumping?: number
  scaleRange?: [number, number]
  /** Sample area, as a radius around the board's origin. */
  radius?: number
}

export interface DestinationProps {
  arrival: number
  hovered: boolean
  onHover: (hovered: boolean) => void
  onSelect: () => void
}

export interface WorldForm {
  /** Registry key. A CMS world document names this. */
  id: string
  /** Shown in the CMS form picker. */
  title: string
  board: Board
  /** Height of the land at a point. The single source of truth: the mesh,
   *  the water, the route, the planting and the camera all read from it. */
  height: (x: number, z: number) => number
  /** Where the route of captured light runs, as (x, z) waypoints. */
  route: Array<[number, number]>
  /** Where the route ends, and where the destination structure stands. */
  destination: { x: number; z: number }
  /** How close the path is allowed to come to the water's edge. */
  shoreMargin: number
  /** For a coast-like form, the waterline as a function of depth into the
   *  scene. Forms with no waterline leave this out. */
  shoreAt?: (z: number) => number
  camera: { desktop: CameraKey[]; mobile: CameraKey[] }
  /** What this world is made of, when it is not earth and grass. The CMS
   *  mood still sets the key; this only says what material is being lit. */
  tones?: GroundTones
  planting: Planting[]
  /** The structure the route arrives at. */
  Destination: ComponentType<DestinationProps>
  /** Anything else unique to this world. */
  Scenery?: ComponentType<{ quality: Quality }>
  /** Whether the base around the land reads as water or as a dry surface. */
  base: 'water' | 'dry'
}
