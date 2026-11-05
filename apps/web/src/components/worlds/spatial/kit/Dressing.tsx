import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { quantise } from './contour'
import { scatter, type Placement } from './scatter'

import type { WorldPalette } from './palette'
import type { Planting, Quality, WorldForm } from './types'

/**
 * The shared kit of things a model-maker puts on a board.
 *
 * Every piece is turned from the same stock as the ground it stands on — the
 * trees are foam balls on wire, the figures are headed pins, the posts are
 * stripwood. That single-material discipline is the trick: identical geometry
 * reads as a cheap game asset when it is painted in full colour, and as a
 * crafted model when it is not.
 *
 * Scale is fixed across all worlds: a figure stands 0.16 units, which makes
 * a tree 0.5–0.9 and a two-storey structure about 1.6. Every form is authored
 * against that, so moving between worlds never re-reads the scale.
 */

/** Merge parts into one geometry, so a whole prop is a single draw. */
function assemble(parts: THREE.BufferGeometry[]) {
  const flattened = parts.map((geometry) => {
    const flat = geometry.toNonIndexed()
    geometry.dispose()
    flat.deleteAttribute('uv')
    return flat
  })
  const merged = mergeGeometries(flattened)
  flattened.forEach((geometry) => geometry.dispose())
  return merged
}

function at(geometry: THREE.BufferGeometry, x: number, y: number, z: number) {
  geometry.translate(x, y, z)
  return geometry
}

const BUILDERS: Record<Planting['kind'], () => THREE.BufferGeometry> = {
  'round-tree': () =>
    assemble([
      at(new THREE.CylinderGeometry(0.012, 0.02, 0.34, 6), 0, 0.17, 0),
      at(new THREE.SphereGeometry(0.17, 14, 12), 0, 0.46, 0),
    ]),

  'cone-tree': () =>
    assemble([
      at(new THREE.CylinderGeometry(0.012, 0.02, 0.2, 6), 0, 0.1, 0),
      at(new THREE.ConeGeometry(0.15, 0.52, 14), 0, 0.44, 0),
    ]),

  scrub: () =>
    assemble([
      at(new THREE.SphereGeometry(0.1, 10, 8), 0, 0.06, 0),
      at(new THREE.SphereGeometry(0.07, 10, 8), 0.1, 0.04, 0.05),
    ]),

  /* the only thing here that is grown rather than built: marsh reed */
  reed: () =>
    assemble([
      at(new THREE.ConeGeometry(0.018, 0.4, 4), 0, 0.2, 0),
      at(new THREE.ConeGeometry(0.014, 0.3, 4), 0.05, 0.15, 0.03),
      at(new THREE.ConeGeometry(0.014, 0.34, 4), -0.045, 0.17, -0.02),
    ]),

  /* a marker post — a survey stake, a mooring, a boundary */
  post: () =>
    assemble([
      at(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 6), 0, 0.21, 0),
      at(new THREE.BoxGeometry(0.09, 0.02, 0.02), 0, 0.38, 0),
    ]),

  boulder: () => {
    const rock = new THREE.IcosahedronGeometry(0.2, 1)
    rock.scale(1, 0.68, 0.9)
    return assemble([at(rock, 0, 0.11, 0)])
  },
}

/** A figure: a headed pin. The only thing that states the scale outright. */
export function buildFigure() {
  return assemble([
    at(new THREE.CapsuleGeometry(0.026, 0.075, 3, 8), 0, 0.065, 0),
    at(new THREE.SphereGeometry(0.029, 10, 8), 0, 0.145, 0),
  ])
}

export function Instanced({
  geometry,
  material,
  placements,
  step,
  lift = 0,
  castShadow = true,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  placements: Placement[]
  /** Contour step, so props stand on the terrace rather than in it. */
  step: number
  lift?: number
  castShadow?: boolean
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const scale = new THREE.Vector3()

    placements.forEach((placement, index) => {
      position.set(placement.x, quantise(placement.y, step) + lift, placement.z)
      euler.set(0, placement.rotation, 0)
      quaternion.setFromEuler(euler)
      scale.setScalar(placement.scale)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(index, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements, lift, step])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(placements.length, 1)]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  )
}

/** Which palette tone each kind of dressing is turned from. */
const TONE: Record<Planting['kind'], keyof WorldPalette> = {
  'round-tree': 'mid',
  'cone-tree': 'cutDeep',
  scrub: 'low',
  reed: 'mid',
  post: 'built',
  boulder: 'cut',
}

/**
 * Everything a form asked to be scattered, as one instanced draw per species.
 */
export function Dressing({
  form,
  palette,
  quality,
}: {
  form: WorldForm
  palette: WorldPalette
  quality: Quality
}) {
  const species = useMemo(
    () =>
      form.planting.map((planting) => ({
        key: `${planting.kind}-${planting.seed}`,
        geometry: BUILDERS[planting.kind](),
        material: new THREE.MeshStandardMaterial({
          color: palette[TONE[planting.kind]],
          roughness: 0.88,
        }),
        placements: scatter(form, planting, quality),
        castShadow: planting.kind !== 'scrub' || quality === 'full',
      })),
    [form, palette, quality]
  )

  useEffect(
    () => () =>
      species.forEach((entry) => {
        entry.geometry.dispose()
        entry.material.dispose()
      }),
    [species]
  )

  return (
    <group>
      {species.map((entry) => (
        <Instanced
          key={entry.key}
          geometry={entry.geometry}
          material={entry.material}
          placements={entry.placements}
          step={form.board.contourStep}
          castShadow={entry.castShadow}
        />
      ))}
    </group>
  )
}
