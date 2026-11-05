import * as THREE from 'three'

import type { WorldPalette } from './palette'
import type { Board, WorldForm } from './types'

/**
 * Cutting a world out of contour layers.
 *
 * Every Pocket World is built the way a topographic model is: the heightfield
 * is quantised to fixed steps, so the land becomes a stack of flat terraces
 * separated by near-vertical cut faces. The form supplies the height function
 * and the step; everything here is shared.
 */

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Deterministic value noise, three octaves — surface detail only. */
export function noise2(x: number, z: number) {
  const a = Math.sin(x * 0.9 + Math.sin(z * 0.7) * 2.1) * Math.cos(z * 1.1 - Math.sin(x * 0.5))
  const b = Math.sin(x * 2.3 + 1.7) * Math.cos(z * 1.9 - 0.4)
  const c = Math.sin(x * 5.1 - 2.2) * Math.cos(z * 4.7 + 1.1)
  return a * 0.6 + b * 0.28 + c * 0.12
}

/**
 * The taper that turns any height function into an object sitting on a base.
 *
 * Forms call this last. Without it the terrain ends on the square edge of its
 * own mesh, which reads as a bug rather than as a coastline.
 */
export function taperToBase(board: Board, x: number, z: number, height: number) {
  const dx = x - board.extent.x
  const dz = z - board.extent.z
  const theta = Math.atan2(dz, dx)
  /* the boundary wanders with bearing, so the land is a landmass rather than
     a disc with contours printed on it */
  const wobble =
    1 +
    board.extent.wobble * (0.65 * Math.sin(theta * 2.3 + 0.9) + 0.35 * Math.sin(theta * 3.7 - 1.4))
  const edge = Math.hypot(dx, dz) / wobble
  const taper = smoothstep(board.extent.outer, board.extent.inner, edge)
  return height * taper - 2.2 * (1 - taper)
}

/** The furthest the land can reach from the board's centre, in any direction. */
export function maxReach(board: Board) {
  return board.extent.outer * (1 + board.extent.wobble)
}

/** Snaps a height onto a terrace. Used to stand props flat on the ground. */
export function quantise(height: number, step: number) {
  if (height <= 0) {
    return height
  }
  return Math.floor(height / step) * step
}

/**
 * The same quantisation, but with the last fraction of each step rolled over
 * rather than cut square.
 *
 * A hard `floor` puts the level change inside a single grid cell, and because
 * the cell is square the contour edge comes out serrated in plan — the
 * giveaway that this is a sampled field and not cut card. Rolling the top of
 * each step over a short ramp removes the hard silhouette while the terrace
 * stays flat across most of its width.
 */
function terrace(height: number, step: number) {
  if (height <= 0) {
    return height
  }
  const scaled = height / step
  const level = Math.floor(scaled)
  return (level + smoothstep(0.88, 1.0, scaled - level)) * step
}

/** Surface normal by central difference — used for placement and dressing. */
export function normalAt(form: WorldForm, x: number, z: number, epsilon = 0.4) {
  const left = form.height(x - epsilon, z)
  const right = form.height(x + epsilon, z)
  const back = form.height(x, z - epsilon)
  const front = form.height(x, z + epsilon)
  return new THREE.Vector3(left - right, 2 * epsilon, back - front).normalize()
}

/**
 * The land mesh.
 *
 * Vertex-coloured, so one material covers every terrace and cut face without
 * a texture fetch. Colour is a thin wash by elevation laid over the value
 * structure the contours already give — the cuts keep doing the work of
 * describing the form, and the wash only says what the ground is.
 */
export function buildContourGeometry(form: WorldForm, segments: number, palette: WorldPalette) {
  const { span, contourStep } = form.board
  const geometry = new THREE.PlaneGeometry(span, span, segments, segments)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position as THREE.BufferAttribute
  const count = positions.count
  const colors = new Float32Array(count * 3)
  const levels = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const stepped = terrace(form.height(positions.getX(i), positions.getZ(i)), contourStep)
    positions.setY(i, stepped)
    levels[i] = stepped
  }

  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal as THREE.BufferAttribute

  const color = new THREE.Color()
  const wash = new THREE.Color()
  /* elevation bands, expressed in contour steps so a form that stands taller
     still grades across its whole height */
  const shore = contourStep * 1.0
  const middle = contourStep * 3.0
  const upper = contourStep * 7.5

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const height = levels[i]
    const slope = 1 - normals.getY(i)

    if (height < shore) {
      wash.copy(palette.edge).lerp(palette.low, smoothstep(0, shore, height))
    } else if (height < middle) {
      wash.copy(palette.low).lerp(palette.mid, smoothstep(shore, middle, height))
    } else {
      wash.copy(palette.mid).lerp(palette.high, smoothstep(middle, upper, height))
    }

    /* Broad patches, so the terraces are never one flat tone. Low frequency
       only — fine mottling reads as noise at this scale. */
    const patch = (noise2(x * 0.17 - 11, z * 0.17 + 7) + 1) / 2
    wash.lerp(palette.mid, patch * 0.32 * smoothstep(shore, middle, height))

    /* terraces climb toward the light */
    const tier = THREE.MathUtils.clamp(height / (contourStep * 16), 0, 1)
    color.copy(wash).lerp(palette.lit, tier * 0.4)

    /* a cut face is exposed material, and it is in shade — hue and value */
    color.lerp(palette.cut, smoothstep(0.18, 0.6, slope) * 0.85)
    color.lerp(palette.cutDeep, smoothstep(0.45, 0.85, slope) * 0.55)

    /* below the base's surface the ground sinks away */
    if (height < 0) {
      color.copy(palette.edge).lerp(palette.sunk, smoothstep(-0.3, -4, height))
    }

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * The heightfield baked to a texture, so the base shader can read how deep it
 * is at any point and score its own contour lines against the real land.
 */
export function buildHeightTexture(form: WorldForm, size: number) {
  const data = new Float32Array(size * size)
  const half = form.board.span / 2

  for (let j = 0; j < size; j++) {
    const z = THREE.MathUtils.lerp(-half, half, j / (size - 1))
    for (let i = 0; i < size; i++) {
      const x = THREE.MathUtils.lerp(-half, half, i / (size - 1))
      data[j * size + i] = form.height(x, z)
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.FloatType)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}
