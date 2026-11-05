/**
 * Orrery geometry: where each world's planet sits on its orbit at a moment.
 * Pure, so the server renders the exact first frame the client continues.
 */
export const GOLDEN_ANGLE = 2.39996
export const ORBIT_TILT = 0.38 /* ry / rx */

export interface OrbitPlacement {
  /** Centre of the planet, % of the system box. */
  x: number
  y: number
  /** 0 (far side) … 1 (near side) */
  depth: number
}

export function orbitRadius(index: number, count: number) {
  /* % of the box width (diameter): inner orbit 26, outer 84, so the outermost
     planet never leaves the box */
  const inner = 26
  const outer = 84
  return count <= 1 ? (inner + outer) / 2 : inner + ((outer - inner) * index) / (count - 1)
}

/** Seconds per revolution: outer orbits are slower (a gentle nod to Kepler). */
export function orbitPeriod(index: number, count: number) {
  const radius = orbitRadius(index, count)
  return 150 * (radius / 26) ** 1.2
}

export function orbitPlacement(index: number, count: number, seconds: number): OrbitPlacement {
  const rx = orbitRadius(index, count) / 2
  const ry = rx * ORBIT_TILT
  const start = -Math.PI / 2 + 0.55 + index * GOLDEN_ANGLE
  const angle = start + (seconds / orbitPeriod(index, count)) * Math.PI * 2
  return {
    x: 50 + Math.cos(angle) * rx,
    y: 50 + Math.sin(angle) * ry * 2 /* box is wider than tall: keep the ring round-ish */,
    depth: (Math.sin(angle) + 1) / 2,
  }
}
