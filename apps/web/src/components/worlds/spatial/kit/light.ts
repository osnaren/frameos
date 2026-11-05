import * as THREE from 'three'

/**
 * One light direction for every world.
 *
 * A model is photographed on a table under one softbox, and every Pocket
 * World is lit the same way — so the light never becomes a thing the visitor
 * has to re-read when they move between worlds. The sky, the base's sheen and
 * the key light all take this vector.
 */
export const SUN_DIRECTION = new THREE.Vector3(-0.38, 0.62, 0.68).normalize()

/** Daylight intensities, and what they fall to when the site is in dark mode. */
export const DAY_LIGHT = { key: 1.45, fill: 0.72, ambient: 0.3 }
export const DUSK_LIGHT = { key: 0.5, fill: 0.26, ambient: 0.14 }

/** How long the flight into a collection takes, in seconds. */
export const FLIGHT_SECONDS = 1.15
