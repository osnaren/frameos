import * as THREE from 'three'

import type { WorldSlug } from '@/content/worlds'

/**
 * Spatial layout of the Pocket Worlds archipelago.
 *
 * Five miniature islands float in a bright sky-mist, arranged along a
 * descending meander so the camera voyages forward (−z) through the whole
 * chain. Each island rises or dips to give the journey a vertical rhythm:
 * Wander at eye level, Sacred Geometry elevated, Small Wonders dipping into
 * intimacy, Living Things level and shaded, At the Table settling low and
 * warm. The thread of light and the camera both read this one registry, so
 * the composition stays coherent as worlds are tuned.
 */

export interface WorldPlacement {
  slug: WorldSlug
  /** Island centre in world space */
  anchor: [number, number, number]
  /** Portal base position within the island (local coords) */
  portalLocal: [number, number, number]
  /** Portal facing (radians, Y) so it turns toward the arriving camera */
  portalYaw: number
  /** Camera dwell pose, world space */
  camPos: [number, number, number]
  camLook: [number, number, number]
  /** Camera travel pose approaching this world, world space */
  approachPos: [number, number, number]
  approachLook: [number, number, number]
}

export const WORLD_PLACEMENTS: WorldPlacement[] = [
  {
    slug: 'wander',
    anchor: [0, 0, 0],
    portalLocal: [2.35, 0.43, 1.62],
    portalYaw: -0.85,
    approachPos: [-6.5, 3.6, 8.6],
    approachLook: [0.4, 0.3, 0.8],
    camPos: [0.6, 1.5, 4.5],
    camLook: [2.1, 0.55, 1.5],
  },
  {
    slug: 'sacred-geometry',
    anchor: [11.5, 3.2, -17],
    portalLocal: [-1.7, 1.05, 2.0],
    portalYaw: 0.5,
    approachPos: [6.2, 5.0, -8.5],
    approachLook: [10.5, 3.4, -15.5],
    camPos: [9.0, 4.4, -12.0],
    camLook: [11.2, 3.6, -16.4],
  },
  {
    slug: 'small-wonders',
    anchor: [-1, -2.2, -33],
    portalLocal: [1.9, 0.32, 1.8],
    portalYaw: -0.8,
    approachPos: [-6.5, 1.2, -25],
    approachLook: [-1.4, -1.6, -31.6],
    camPos: [-0.4, -0.7, -28.4],
    camLook: [0.7, -1.7, -31.5],
  },
  {
    slug: 'living-things',
    anchor: [-12.5, 0.4, -49],
    portalLocal: [2.0, 0.24, 1.7],
    portalYaw: -0.8,
    approachPos: [-6.5, 2.6, -41],
    approachLook: [-11.8, 0.2, -47.6],
    camPos: [-10.4, 1.4, -44.6],
    camLook: [-11.0, 0.4, -47.8],
  },
  {
    slug: 'at-the-table',
    anchor: [1.5, -2.6, -65],
    portalLocal: [1.7, 0.28, 1.8],
    portalYaw: -0.8,
    approachPos: [-4.5, 0.4, -57],
    approachLook: [1.4, -2.2, -63.4],
    camPos: [2.2, -1.2, -60.5],
    camLook: [2.0, -2.2, -63.6],
  },
]

export function portalWorldPosition(placement: WorldPlacement) {
  return new THREE.Vector3(
    placement.anchor[0] + placement.portalLocal[0],
    placement.anchor[1] + placement.portalLocal[1],
    placement.anchor[2] + placement.portalLocal[2]
  )
}

/** The connecting thread's control points: a high start, a pass across each
 *  island through its portal, and a descent into mist past the last world. */
export function buildThreadCurve() {
  const points: THREE.Vector3[] = [new THREE.Vector3(-3.2, 4.2, 9.5)]

  WORLD_PLACEMENTS.forEach((placement, index) => {
    const portal = portalWorldPosition(placement)
    const before = index === 0 ? new THREE.Vector3(-1.2, 1.2, 4.4) : null
    if (before) {
      points.push(before)
    }
    /* rise slightly before the island, dip to the portal, rise after */
    points.push(portal.clone().add(new THREE.Vector3(-0.9, 0.9, 1.4)))
    points.push(portal.clone().add(new THREE.Vector3(0, 0.08, 0)))
    points.push(portal.clone().add(new THREE.Vector3(0.6, 1.1, -1.6)))
  })

  const last = portalWorldPosition(WORLD_PLACEMENTS[WORLD_PLACEMENTS.length - 1])
  points.push(last.clone().add(new THREE.Vector3(-1.5, 2.4, -6)))

  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)
}

export interface CameraKey {
  scroll: number
  position: [number, number, number]
  look: [number, number, number]
}

/* journey timeline: opening view, then travel+dwell per world, then close */
const OPENING = 0.05
const CLOSING = 0.955
const DWELL = 0.42

export function buildCameraKeys(): CameraKey[] {
  const keys: CameraKey[] = [{ scroll: 0, position: [-9.6, 6.6, 13.2], look: [-3.1, -1.3, 1.5] }]
  const span = (CLOSING - OPENING) / WORLD_PLACEMENTS.length

  WORLD_PLACEMENTS.forEach((placement, index) => {
    const bandStart = OPENING + span * index
    const approachScroll = bandStart + span * 0.34
    const settleScroll = bandStart + span * (1 - DWELL / 2)
    const holdScroll = bandStart + span
    keys.push({
      scroll: approachScroll,
      position: placement.approachPos,
      look: placement.approachLook,
    })
    keys.push({ scroll: settleScroll, position: placement.camPos, look: placement.camLook })
    keys.push({ scroll: holdScroll, position: placement.camPos, look: placement.camLook })
  })

  const last = WORLD_PLACEMENTS[WORLD_PLACEMENTS.length - 1]
  keys.push({
    scroll: 1,
    position: [last.anchor[0] - 2, last.anchor[1] + 3.4, last.anchor[2] + 5.5],
    look: [last.anchor[0], last.anchor[1] + 0.2, last.anchor[2]],
  })

  return keys
}

/** Mobile keeps the same route but tighter and higher, for portrait framing. */
export function buildMobileCameraKeys(): CameraKey[] {
  return buildCameraKeys().map((key, index) => {
    if (index === 0) {
      return { scroll: 0, position: [-1.5, 8.2, 10.5], look: [-1.2, -1.4, 0.4] }
    }
    /* lift and pull the dwell poses so portrait crops read the island */
    return {
      ...key,
      position: [key.position[0] * 0.75, key.position[1] + 1.3, key.position[2] + 1.6],
    }
  })
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

export function sampleCameraKeys(
  keys: CameraKey[],
  scroll: number,
  position: THREE.Vector3,
  look: THREE.Vector3
) {
  const p = THREE.MathUtils.clamp(scroll, 0, 1)
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p <= b.scroll) {
      const t = smoothstep(
        THREE.MathUtils.clamp((p - a.scroll) / Math.max(b.scroll - a.scroll, 1e-5), 0, 1)
      )
      position.set(
        THREE.MathUtils.lerp(a.position[0], b.position[0], t),
        THREE.MathUtils.lerp(a.position[1], b.position[1], t),
        THREE.MathUtils.lerp(a.position[2], b.position[2], t)
      )
      look.set(
        THREE.MathUtils.lerp(a.look[0], b.look[0], t),
        THREE.MathUtils.lerp(a.look[1], b.look[1], t),
        THREE.MathUtils.lerp(a.look[2], b.look[2], t)
      )
      return
    }
  }
  const last = keys[keys.length - 1]
  position.set(...last.position)
  look.set(...last.look)
}

/** How settled the visitor is at world `index` (0 travelling … 1 arrived). */
export function worldArrival(scroll: number, index: number) {
  const span = (CLOSING - OPENING) / WORLD_PLACEMENTS.length
  const bandStart = OPENING + span * index
  const settle = bandStart + span * (1 - DWELL / 2)
  const half = span * 0.5
  return THREE.MathUtils.clamp(1 - Math.abs(scroll - settle) / half, 0, 1)
}

/** Scroll fraction that centres a world's dwell (progress-rail links). */
export function worldScrollTarget(index: number) {
  const span = (CLOSING - OPENING) / WORLD_PLACEMENTS.length
  return OPENING + span * index + span * (1 - DWELL / 2)
}

/** Head of the light thread for a given scroll, gently leading the camera. */
export function threadHead(scroll: number) {
  return THREE.MathUtils.clamp((scroll - 0.02) / 0.93, 0, 1)
}
