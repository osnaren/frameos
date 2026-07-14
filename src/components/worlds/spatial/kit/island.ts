import * as THREE from 'three'

/**
 * Generalised floating-island geometry for the Pocket Worlds journey.
 *
 * Each world authors a heightfield and a vertex-paint function in local
 * island coordinates (origin-centred, +y up). This builder samples them onto
 * a plane, culls everything past the island footprint so the world truly
 * floats (no ground skirt), computes normals, and bakes per-vertex colour.
 * The result is one cohesive stylised diorama surface shared by all worlds.
 */

export interface IslandSpec {
  /** Nominal island radius (footprint scales around it) */
  radius: number
  /** Plane extent sampled (should exceed 2 × radius for the cliff walls) */
  span: number
  /** Mesh resolution */
  segments: number
  /** Footprint radius by polar angle — gives the island an irregular edge */
  footprint: (theta: number) => number
  /** Surface height at a local (x, z) */
  height: (x: number, z: number) => number
  /** Per-vertex colour from position, height and slope (0 flat … 1 vertical) */
  paint: (color: THREE.Color, x: number, z: number, h: number, slope: number) => void
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

/** Cheap deterministic value noise (two octaves) for surface detail. */
export function noise2(x: number, z: number) {
  const n1 = Math.sin(x * 1.7 + Math.sin(z * 1.3) * 2.1) * Math.cos(z * 1.9 - Math.sin(x * 0.8))
  const n2 = Math.sin(x * 4.3 + 1.7) * Math.cos(z * 3.7 - 0.4)
  return n1 * 0.7 + n2 * 0.3
}

export function buildIslandGeometry(spec: IslandSpec) {
  const geometry = new THREE.PlaneGeometry(spec.span, spec.span, spec.segments, spec.segments)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < positions.count; i++) {
    positions.setY(i, spec.height(positions.getX(i), positions.getZ(i)))
  }

  /* keep only triangles touching the island footprint — the cliff edge is
     the true boundary, so the mass reads as a floating world */
  const index = geometry.getIndex()!
  const kept: number[] = []
  const inside = (vi: number) => {
    const x = positions.getX(vi)
    const z = positions.getZ(vi)
    return Math.hypot(x, z) < spec.footprint(Math.atan2(z, x)) + 0.62
  }
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    if (inside(a) || inside(b) || inside(c)) {
      kept.push(a, b, c)
    }
  }
  geometry.setIndex(kept)

  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal as THREE.BufferAttribute

  const colors = new Float32Array(positions.count * 3)
  const color = new THREE.Color()
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const h = positions.getY(i)
    const slope = 1 - normals.getY(i)
    spec.paint(color, x, z, h, slope)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return geometry
}

export interface ScatterOptions {
  count: number
  seed: number
  minHeight?: number
  maxSlopeProbe?: number
  /** Local points to avoid (x, z, radius) — routes, portals, water */
  avoid?: Array<[number, number, number]>
}

export interface ScatterSpot {
  x: number
  y: number
  z: number
  scale: number
  rotation: number
}

/** Deterministic scatter of props on gentle ground within the footprint. */
export function scatterOnIsland(spec: IslandSpec, options: ScatterOptions): ScatterSpot[] {
  const { count, seed, minHeight = 0.18, maxSlopeProbe = 0.24, avoid = [] } = options
  const results: ScatterSpot[] = []
  let s = seed || 1
  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }

  let guard = 0
  while (results.length < count && guard < count * 80) {
    guard++
    const theta = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * (spec.radius - 0.5)
    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius
    const y = spec.height(x, z)

    if (y < minHeight) {
      continue
    }
    const probe = Math.abs(spec.height(x + 0.22, z) - y) + Math.abs(spec.height(x, z + 0.22) - y)
    if (probe > maxSlopeProbe) {
      continue
    }
    if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar)) {
      continue
    }

    results.push({ x, y, z, scale: 0.55 + random() * 0.32, rotation: random() * Math.PI * 2 })
  }

  return results
}
