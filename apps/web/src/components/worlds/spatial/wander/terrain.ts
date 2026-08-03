import * as THREE from 'three'

/**
 * Authored heightfield for the Wander island diorama.
 *
 * The island is sculpted, not random: a low sand shore and lagoon at the
 * front-left, rolling grass terraces through the middle, an elevated rock
 * plateau at the back-right with a carved waterfall notch, and a small
 * headland rise at the front-right where the light route ends at the portal.
 * Outside the footprint the surface plunges into a rocky skirt, so the same
 * mesh forms the island top and its diorama walls.
 */

export const ISLAND_RADIUS = 4.2
export const TERRAIN_SPAN = 11.5
const SKIRT_DEPTH = 2.0

/* Landmarks shared by terrain, water, route, and set dressing */
export const PLATEAU = { x: 1.5, z: -1.9, radius: 1.55, height: 1.22 }
export const LAGOON = { x: -1.95, z: 3.0, radius: 1.5 }
export const FALLS = { x: 1.06, z: -0.52, poolX: 0.98, poolZ: 0.38 }
export const HEADLAND = { x: 2.35, z: 1.62 }

export function footprintRadius(theta: number) {
  return ISLAND_RADIUS * (1 + 0.15 * Math.sin(2 * theta + 1.3) + 0.09 * Math.sin(5 * theta + 0.6))
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function gauss(x: number, z: number, cx: number, cz: number, sigma: number) {
  const dx = x - cx
  const dz = z - cz
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma))
}

/** Cheap deterministic value noise (two octaves) for surface detail. */
function noise2(x: number, z: number) {
  const n1 = Math.sin(x * 1.7 + Math.sin(z * 1.3) * 2.1) * Math.cos(z * 1.9 - Math.sin(x * 0.8))
  const n2 = Math.sin(x * 4.3 + 1.7) * Math.cos(z * 3.7 - 0.4)
  return n1 * 0.7 + n2 * 0.3
}

export function terrainHeight(x: number, z: number) {
  const d = Math.hypot(x, z)
  const theta = Math.atan2(z, x)
  const edge = footprintRadius(theta)
  const inside = smoothstep(edge + 0.45, edge - 0.55, d)

  /* gentle rise from the front shore toward the back */
  let h = 0.16 + 0.34 * smoothstep(2.6, -2.8, z)

  /* rolling interior hills */
  h += 0.34 * gauss(x, z, -1.7, -0.7, 1.5)
  h += 0.2 * gauss(x, z, 0.5, 0.7, 1.15)
  h += 0.24 * gauss(x, z, -2.4, 1.0, 1.0)

  /* elevated plateau, gently undulating on top */
  const plateauMask = smoothstep(
    PLATEAU.radius + 0.55,
    PLATEAU.radius - 0.35,
    Math.hypot(x - PLATEAU.x, z - PLATEAU.z)
  )
  const plateauTop = PLATEAU.height + 0.045 * Math.sin(x * 2.6 + 0.8) * Math.cos(z * 2.2 - 0.5)
  h = h * (1 - plateauMask) + plateauTop * plateauMask

  /* carved waterfall channel down the plateau's front face, into a pool */
  const channel =
    gauss(x, z, FALLS.x, FALLS.z, 0.24) * 0.42 +
    gauss(x, z, (FALLS.x + FALLS.poolX) / 2, (FALLS.z + FALLS.poolZ) / 2, 0.26) * 0.3 +
    gauss(x, z, FALLS.poolX, FALLS.poolZ, 0.3) * 0.34
  h -= channel * (0.35 + 0.65 * plateauMask)

  /* lagoon depression at the front-left — floor sits below the water plane */
  const lagoonMask = smoothstep(
    LAGOON.radius + 1.25,
    LAGOON.radius - 0.55,
    Math.hypot(x - LAGOON.x, z - LAGOON.z)
  )
  h = h * (1 - lagoonMask) + -0.22 * lagoonMask

  /* soft sand apron around the lagoon: flatten low ground toward beach level */
  const beachness = smoothstep(0.34, 0.1, h) * (1 - lagoonMask)
  h = h * (1 - beachness * 0.55) + 0.1 * beachness * 0.55

  /* headland rise where the route ends, flattened where the portal stands */
  h += 0.24 * gauss(x, z, HEADLAND.x, HEADLAND.z, 0.72)
  const pad = smoothstep(0.55, 0.25, Math.hypot(x - HEADLAND.x, z - HEADLAND.z))
  h = h * (1 - pad) + 0.46 * pad

  /* surface detail */
  h += 0.045 * noise2(x * 1.35, z * 1.35) * inside

  /* island walls: outside the footprint everything falls away, craggily */
  const crag = 0.4 * (0.5 + 0.5 * noise2(x * 0.9 + 7, z * 0.9 - 4))
  return h * inside - (SKIRT_DEPTH + crag) * (1 - inside)
}

/* ---- palette ---- */

const SAND = new THREE.Color('#e3d2ac')
const SAND_WET = new THREE.Color('#d2bd96')
const GRASS_A = new THREE.Color('#9aae7e')
const GRASS_B = new THREE.Color('#7e9a67')
const GRASS_DRY = new THREE.Color('#bcc294')
const ROCK = new THREE.Color('#7a6b57')
const ROCK_DARK = new THREE.Color('#4a4136')
const PLATEAU_GRASS = new THREE.Color('#8ba873')

export function buildTerrainGeometry(segments = 168) {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SPAN, TERRAIN_SPAN, segments, segments)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(positions.count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const h = terrainHeight(x, z)
    positions.setY(i, h)
  }

  /* the mesh ends at the cliff walls — cull everything beyond the island
     footprint so the world truly floats instead of sitting on a skirt */
  const index = geometry.getIndex()!
  const kept: number[] = []
  const insideMargin = (vi: number) => {
    const x = positions.getX(vi)
    const z = positions.getZ(vi)
    return Math.hypot(x, z) < footprintRadius(Math.atan2(z, x)) + 0.62
  }
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    if (insideMargin(a) || insideMargin(b) || insideMargin(c)) {
      kept.push(a, b, c)
    }
  }
  geometry.setIndex(kept)

  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal as THREE.BufferAttribute

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const h = positions.getY(i)
    const slope = 1 - normals.getY(i)

    const plateauMask = smoothstep(
      PLATEAU.radius + 0.55,
      PLATEAU.radius - 0.35,
      Math.hypot(x - PLATEAU.x, z - PLATEAU.z)
    )
    const detail = (noise2(x * 2.1 + 5, z * 2.1 - 3) + 1) / 2

    if (h < -0.02) {
      /* lagoon floor is wet sand; the island walls turn to dark rock fast */
      color.copy(SAND_WET).lerp(ROCK_DARK, smoothstep(-0.06, -0.5, h))
    } else if (h < 0.18) {
      color.copy(SAND).lerp(SAND_WET, smoothstep(0.16, 0.02, h))
      /* soft grass creep so the sand/grass boundary never aliases */
      color.lerp(GRASS_A, smoothstep(0.12, 0.18, h) * 0.5)
    } else {
      color.copy(GRASS_A).lerp(GRASS_B, detail)
      color.lerp(GRASS_DRY, smoothstep(0.5, 0.9, detail) * 0.35)
      if (plateauMask > 0.4) {
        color.lerp(PLATEAU_GRASS, plateauMask * 0.8)
      }
    }

    /* steep ground reads as rock — cliff faces, channel, island walls */
    const rockiness = smoothstep(0.38, 0.66, slope)
    if (rockiness > 0) {
      color.lerp(ROCK, rockiness)
      color.lerp(ROCK_DARK, rockiness * smoothstep(0.2, -1.4, h))
      /* horizontal strata make the cliffs read as carved stone */
      const band = 0.5 + 0.5 * Math.sin(h * 9.5 + 0.7)
      color.lerp(ROCK_DARK, rockiness * band * 0.45)
    }

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

/**
 * The light route, laid onto the terrain: from the shore, along the lagoon,
 * up through the terraces, ending on the headland at the portal.
 */
export function buildRouteCurve() {
  const waypoints: Array<[number, number]> = [
    [-3.3, 2.9],
    [-2.2, 2.95],
    [-0.9, 2.45],
    [0.15, 1.85],
    [0.75, 1.05],
    [1.5, 0.75],
    [2.1, 1.15],
    [HEADLAND.x, HEADLAND.z],
  ]

  const points = waypoints.map(([x, z]) => {
    const y = Math.max(terrainHeight(x, z), 0.02) + 0.045
    return new THREE.Vector3(x, y, z)
  })

  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)
}

let routeSamples: THREE.Vector3[] | null = null

function nearRoute(x: number, z: number, clearance: number) {
  routeSamples ??= buildRouteCurve().getPoints(60)
  return routeSamples.some((point) => Math.hypot(point.x - x, point.z - z) < clearance)
}

/** Deterministic scatter positions on grass, for palms and bushes. */
export function scatterOnGrass(
  count: number,
  seed: number,
  minHeight = 0.18,
  maxSlopeProbe = 0.22
) {
  const results: Array<{ x: number; y: number; z: number; scale: number; rotation: number }> = []
  let s = seed

  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }

  let guard = 0
  while (results.length < count && guard < count * 60) {
    guard++
    const theta = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * (ISLAND_RADIUS - 0.55)
    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius
    const y = terrainHeight(x, z)

    if (y < minHeight) {
      continue
    }

    /* avoid steep ground and the route/portal area */
    const probe =
      Math.abs(terrainHeight(x + 0.22, z) - y) + Math.abs(terrainHeight(x, z + 0.22) - y)
    if (probe > maxSlopeProbe) {
      continue
    }
    if (Math.hypot(x - HEADLAND.x, z - HEADLAND.z) < 0.9) {
      continue
    }
    if (Math.hypot(x - FALLS.poolX, z - FALLS.poolZ) < 0.7) {
      continue
    }
    if (nearRoute(x, z, 0.4)) {
      continue
    }

    results.push({ x, y, z, scale: 0.55 + random() * 0.3, rotation: random() * Math.PI * 2 })
  }

  return results
}
