import * as THREE from 'three'

import type { CameraKey } from './types'

/**
 * Scroll to camera.
 *
 * One scroll value drives one parameter; a form's keys turn it into a
 * position and a look-at target. Movement is always a translation plus a slow
 * re-aim — no orbiting, no roll, no field-of-view change — which is what
 * keeps a long scroll from becoming nauseating.
 *
 * Forms author two paths. Portrait is never the desktop path cropped: it sees
 * a far narrower slice of the world, so it needs its own distances and its
 * own aim to keep the destination in the frame.
 */

function smootherstep(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

/** Samples a key list at `scroll`, writing into `position` and `look`. */
export function sampleCamera(
  keys: CameraKey[],
  scroll: number,
  position: THREE.Vector3,
  look: THREE.Vector3
) {
  const t = THREE.MathUtils.clamp(scroll, 0, 1)

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]

    if (t <= b.at || i === keys.length - 2) {
      const span = Math.max(b.at - a.at, 1e-5)
      const k = smootherstep((t - a.at) / span)
      position.set(
        THREE.MathUtils.lerp(a.position[0], b.position[0], k),
        THREE.MathUtils.lerp(a.position[1], b.position[1], k),
        THREE.MathUtils.lerp(a.position[2], b.position[2], k)
      )
      look.set(
        THREE.MathUtils.lerp(a.look[0], b.look[0], k),
        THREE.MathUtils.lerp(a.look[1], b.look[1], k),
        THREE.MathUtils.lerp(a.look[2], b.look[2], k)
      )
      return
    }
  }
}

/** How settled the visitor is at the destination, 0..1. */
export function arrivalAt(scroll: number) {
  const rise = THREE.MathUtils.smoothstep(scroll, 0.63, 0.78)
  const fall = 1 - THREE.MathUtils.smoothstep(scroll, 0.93, 0.99)
  return Math.min(rise, fall)
}

/**
 * How far along the route the light has reached. It starts a little way in,
 * so the opening frame already shows light on the ground rather than an unlit
 * path, and completes as the camera settles at the destination.
 */
export function routeHeadAt(scroll: number) {
  return THREE.MathUtils.clamp(0.07 + scroll / 0.78, 0, 1)
}
