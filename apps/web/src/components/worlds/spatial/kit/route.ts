import * as THREE from 'three'

import type { WorldForm } from './types'

/**
 * The route of captured light, for any world.
 *
 * It is a path over the ground, not a line in the air: every sample is
 * projected onto the land — and, on a form with a waterline, kept clear of
 * it — then laid on the surface, so the ribbon climbs and dips exactly as the
 * terrain does.
 *
 * Curves are cached per form, because the scatter pass asks for distances to
 * the route thousands of times while placing dressing.
 */

/** How far the ribbon floats above the ground, so it never z-fights. */
export const ROUTE_LIFT = 0.09

/** Default half-width of the ribbon. */
export const ROUTE_HALF_WIDTH = 0.5

export interface WorldRoute {
  curve: THREE.CatmullRomCurve3
  /** Ground height the ribbon rides on, never dipping below the base. */
  groundAt: (x: number, z: number) => number
  /** Distance to the nearest point on the route. */
  distanceTo: (x: number, z: number) => number
  /** A ribbon laid over the terrain. */
  ribbon: (segments: number, halfWidth: number) => THREE.BufferGeometry
  pointAt: (t: number, target?: THREE.Vector3) => THREE.Vector3
}

const cache = new WeakMap<WorldForm, WorldRoute>()

export function worldRoute(form: WorldForm): WorldRoute {
  const existing = cache.get(form)
  if (existing) {
    return existing
  }

  const groundAt = (x: number, z: number) => Math.max(form.height(x, z), 0.12)

  /* Pull a waypoint inland if the form's waterline has wandered across it. */
  const onLand = (x: number, z: number) =>
    form.shoreAt ? Math.min(x, form.shoreAt(z) - form.shoreMargin) : x

  const curve = new THREE.CatmullRomCurve3(
    form.route.map(([x, z]) => {
      const safeX = onLand(x, z)
      return new THREE.Vector3(safeX, groundAt(safeX, z) + ROUTE_LIFT, z)
    }),
    false,
    'centripetal',
    0.5
  )

  const samples = curve.getSpacedPoints(120)

  const route: WorldRoute = {
    curve,
    groundAt,

    distanceTo(x, z) {
      let best = Infinity
      for (const point of samples) {
        const dx = point.x - x
        const dz = point.z - z
        const distance = dx * dx + dz * dz
        if (distance < best) {
          best = distance
        }
      }
      return Math.sqrt(best)
    },

    /**
     * Both edges are sampled against the heightfield independently, so the
     * strip banks with the ground instead of hovering over it on slopes.
     *
     * UVs: `u` runs along the route (0 at the start, 1 at the destination),
     * `v` runs across it — the shader uses `u` for the lit fraction and `v`
     * for the soft edge falloff.
     */
    ribbon(segments, halfWidth) {
      const positions = new Float32Array((segments + 1) * 2 * 3)
      const uvs = new Float32Array((segments + 1) * 2 * 2)
      const indices: number[] = []

      const point = new THREE.Vector3()
      const tangent = new THREE.Vector3()
      const side = new THREE.Vector3()
      const up = new THREE.Vector3(0, 1, 0)

      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        curve.getPointAt(t, point)
        curve.getTangentAt(t, tangent)
        side.crossVectors(tangent, up).normalize().multiplyScalar(halfWidth)

        for (let e = 0; e < 2; e++) {
          const sign = e === 0 ? -1 : 1
          const x = point.x + side.x * sign
          const z = point.z + side.z * sign
          const index = (i * 2 + e) * 3
          positions[index] = x
          positions[index + 1] = groundAt(x, z) + ROUTE_LIFT
          positions[index + 2] = z

          const uvIndex = (i * 2 + e) * 2
          uvs[uvIndex] = t
          uvs[uvIndex + 1] = e
        }

        if (i < segments) {
          const a = i * 2
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
        }
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
      return geometry
    },

    pointAt(t, target = new THREE.Vector3()) {
      return curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1), target)
    },
  }

  cache.set(form, route)
  return route
}
