import * as THREE from 'three'

import { noise2, normalAt } from './contour'
import { worldRoute } from './route'

import type { Planting, Quality, WorldForm } from './types'

/**
 * Deterministic dressing placement.
 *
 * Every position is derived from a seeded sequence and filtered against the
 * form's own heightfield, so the same world comes back on every render — no
 * drift between the server, the client, or two visits.
 *
 * Placement is deliberately sparse and heavily filtered. A model gets its
 * quality from restraint; covering the board is what makes a scene read as a
 * game level.
 */

export interface Placement {
  x: number
  y: number
  z: number
  scale: number
  rotation: number
  tint: number
}

export function scatter(form: WorldForm, planting: Planting, quality: Quality): Placement[] {
  const {
    count,
    seed,
    minHeight,
    maxHeight,
    maxSlope,
    routeClearance,
    destinationClearance,
    clumping = 0,
    scaleRange = [0.75, 1.3],
    radius = form.board.span / 2 - 6,
  } = planting

  const target = quality === 'full' ? count.full : count.lite
  const route = worldRoute(form)
  const results: Placement[] = []
  let state = seed || 1

  const random = () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }

  let guard = 0
  const maxAttempts = target * 90

  while (results.length < target && guard < maxAttempts) {
    guard++

    const x = (random() * 2 - 1) * radius
    const z = (random() * 2 - 1) * radius
    const y = form.height(x, z)

    if (y < minHeight || y > maxHeight) {
      continue
    }

    /* 1 - normal.y approximates the slope */
    if (1 - normalAt(form, x, z).y > maxSlope) {
      continue
    }

    /* The destination stays open. It has to read as a clearing you arrive at,
       and planting right up to it is what buries it. */
    if (Math.hypot(x - form.destination.x, z - form.destination.z) < destinationClearance) {
      continue
    }

    if (route.distanceTo(x, z) < routeClearance) {
      continue
    }

    /* Clumping rejects samples in the sparse half of a noise field, so planting
       gathers into stands and leaves open ground between them. */
    if (clumping > 0) {
      const density = (noise2(x * 0.22 + seed * 0.01, z * 0.22 - seed * 0.01) + 1) / 2
      if (random() > THREE.MathUtils.lerp(1, density, clumping)) {
        continue
      }
    }

    results.push({
      x,
      y,
      z,
      scale: THREE.MathUtils.lerp(scaleRange[0], scaleRange[1], random()),
      rotation: random() * Math.PI * 2,
      tint: random(),
    })
  }

  return results
}
