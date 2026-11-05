import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { buildContourGeometry, noise2 } from './contour'

import type { WorldPalette } from './palette'
import type { Quality, WorldForm } from './types'

/**
 * The board a world is cut from, and the little that sits behind it.
 *
 * The near land is one vertex-coloured, contour-stepped mesh. Behind it are
 * three ranges, and they are deliberately almost gone — a model gets its
 * quality from the emptiness around it, so these are whispers that give the
 * eye a sense of distance without putting anything in the frame to look at.
 */

/** A ridge silhouette: a long landmass profile with a quiet crest. */
function buildRidgeGeometry(width: number, height: number, seed: number, segments = 128) {
  const positions = new Float32Array((segments + 1) * 2 * 3)
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = (t - 0.5) * width

    const profile =
      0.5 * Math.sin(t * 6.1 + seed) +
      0.28 * Math.sin(t * 13.7 - seed * 1.7) +
      0.14 * Math.sin(t * 29.3 + seed * 0.6)
    /* tapers to nothing at both ends, so the range sinks away rather than
       being clipped off by the frame */
    const taper = Math.pow(Math.sin(Math.PI * t), 0.45)
    const crest = Math.max(0, height * taper * (0.66 + 0.34 * profile))

    positions[i * 6] = x
    positions[i * 6 + 1] = -1.5
    positions[i * 6 + 2] = 0
    positions[i * 6 + 3] = x
    positions[i * 6 + 4] = crest
    positions[i * 6 + 5] = 0

    if (i < segments) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

const RIDGES = [
  { key: 'near', distance: -104, offsetX: -36, width: 250, height: 12, seed: 1.7, blend: 0.68 },
  { key: 'mid', distance: -160, offsetX: 28, width: 340, height: 18, seed: 4.2, blend: 0.82 },
  { key: 'far', distance: -224, offsetX: -8, width: 440, height: 27, seed: 8.9, blend: 0.91 },
]

export function Land({
  form,
  palette,
  quality,
  dusk,
}: {
  form: WorldForm
  palette: WorldPalette
  quality: Quality
  dusk: number
}) {
  const terrain = useMemo(
    () =>
      buildContourGeometry(
        form,
        quality === 'full' ? form.board.segments.full : form.board.segments.lite,
        palette
      ),
    [form, palette, quality]
  )

  const ridgeMaterials = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const level = useRef(0)

  const ridges = useMemo(
    () =>
      RIDGES.map((ridge) => ({
        ...ridge,
        geometry: buildRidgeGeometry(ridge.width, ridge.height, ridge.seed),
        color: palette.cut.clone().lerp(palette.haze, ridge.blend),
      })),
    [palette]
  )

  /* The ranges are unlit basic material, so the scene lights cannot dim them.
     Without this they stay in full daylight under a dusk sky. */
  useFrame((_, delta) => {
    level.current += (dusk - level.current) * Math.min(delta * 2.5, 1)
    const shade = THREE.MathUtils.lerp(1, 0.36, level.current)
    ridgeMaterials.current.forEach((material, index) => {
      material?.color.copy(ridges[index].color).multiplyScalar(shade)
    })
  })

  useEffect(() => () => terrain.dispose(), [terrain])
  useEffect(() => () => ridges.forEach((ridge) => ridge.geometry.dispose()), [ridges])

  return (
    <group>
      <mesh geometry={terrain} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.86} metalness={0} dithering />
      </mesh>

      {ridges.map((ridge, index) => (
        <mesh
          key={ridge.key}
          geometry={ridge.geometry}
          position={[ridge.offsetX, 0, ridge.distance]}
        >
          {/* double-sided: the strip's winding depends on which way the
              camera has travelled */}
          <meshBasicMaterial
            ref={(node: THREE.MeshBasicMaterial | null) => {
              ridgeMaterials.current[index] = node
            }}
            color={ridge.color}
            side={THREE.DoubleSide}
            fog
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Loose rock. Flat-shaded, so against the smooth terraces it reads as
 * material that was cut rather than moulded.
 */
export function Boulders({
  placements,
  color,
}: {
  placements: Array<[number, number, number, number]>
  color: THREE.Color
}) {
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <group>
      {placements.map(([x, y, z, scale]) => (
        <mesh
          key={`${x}:${z}`}
          geometry={geometry}
          position={[x, y, z]}
          scale={[scale, scale * (0.55 + 0.3 * ((noise2(x, z) + 1) / 2)), scale * 0.88]}
          rotation={[0.2 * noise2(x, z), x * 1.7, 0.15 * noise2(z, x)]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={color} roughness={0.88} flatShading />
        </mesh>
      ))}
    </group>
  )
}
