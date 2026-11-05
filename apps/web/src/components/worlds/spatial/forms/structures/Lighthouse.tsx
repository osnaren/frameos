import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Basin, DestinationTarget, createHaloTexture } from './Basin'
import { useWorldPalette } from '../../kit/context'

import type { DestinationProps } from '../../kit/types'

/**
 * Coast's destination: a lighthouse.
 *
 * The route of captured light climbs the terraces and ends here, and the
 * lantern sends it back out — the idea of the whole archive in one object.
 * Turned from primitives the way a model-maker would turn it on a lathe: a
 * stepped plinth, a tapered tower, one painted band, a gallery lip, a
 * railing, a glazed lantern, a capped roof.
 */
export function Lighthouse({ arrival, hovered, onHover, onSelect }: DestinationProps) {
  const palette = useWorldPalette()
  const lanternRef = useRef<THREE.MeshStandardMaterial>(null)
  const haloRef = useRef<THREE.Sprite>(null)
  const haloTexture = useMemo(() => createHaloTexture(), [])

  useEffect(() => () => haloTexture.dispose(), [haloTexture])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const emphasis = Math.max(arrival, hovered ? 0.9 : 0)

    if (lanternRef.current) {
      /* a slow, steady pulse rather than a rotating beam, which at this scale
         would read as a novelty */
      const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.8))
      lanternRef.current.emissiveIntensity = (0.4 + emphasis * 1.5) * pulse
    }

    if (haloRef.current) {
      haloRef.current.material.opacity =
        (0.08 + emphasis * 0.26) * (0.85 + 0.15 * Math.sin(time * 0.8))
      haloRef.current.scale.setScalar(1.6 + emphasis * 1.5)
    }
  })

  return (
    <group>
      {/* the plinth, cut like another contour */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.9, 2.0, 0.18, 32]} />
        <meshStandardMaterial color={palette.built} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.45, 1.55, 0.18, 32]} />
        <meshStandardMaterial color={palette.lit} roughness={0.78} />
      </mesh>

      {/* tower */}
      <mesh position={[-0.28, 0.5, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.32, 28]} />
        <meshStandardMaterial color={palette.built} roughness={0.8} />
      </mesh>
      <mesh position={[-0.28, 1.72, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.29, 0.46, 2.14, 28]} />
        <meshStandardMaterial color={palette.lit} roughness={0.8} />
      </mesh>

      {/* the one painted band — a lighthouse's own mark */}
      <mesh position={[-0.28, 2.16, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.355, 0.385, 0.42, 28]} />
        <meshStandardMaterial color={palette.mark} roughness={0.72} />
      </mesh>

      {/* gallery lip and railing */}
      <mesh position={[-0.28, 2.84, -0.1]} castShadow>
        <cylinderGeometry args={[0.44, 0.38, 0.1, 28]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>
      <mesh position={[-0.28, 3.02, -0.1]} castShadow>
        <torusGeometry args={[0.41, 0.018, 6, 28]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>

      {/* lantern room — where the captured light ends up */}
      <mesh position={[-0.28, 3.12, -0.1]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.34, 20]} />
        <meshStandardMaterial
          ref={lanternRef}
          color={palette.routeCore}
          emissive={palette.routeCore}
          emissiveIntensity={0.6}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[-0.28, 3.44, -0.1]} castShadow>
        <coneGeometry args={[0.31, 0.3, 20]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>
      <mesh position={[-0.28, 3.64, -0.1]} castShadow>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>

      <sprite ref={haloRef} position={[-0.28, 3.12, -0.1]} scale={1.6}>
        <spriteMaterial
          map={haloTexture}
          transparent
          depthWrite={false}
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>

      {/* keeper's hut, set against the tower */}
      <mesh position={[0.62, 0.5, 0.34]} rotation={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.34, 0.52]} />
        <meshStandardMaterial color={palette.built} roughness={0.82} />
      </mesh>
      <mesh position={[0.62, 0.74, 0.34]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.78, 0.14, 0.58]} />
        <meshStandardMaterial color={palette.cut} roughness={0.82} />
      </mesh>

      <Basin position={[0.5, 0.4, -0.78]} arrival={arrival} hovered={hovered} />
      <DestinationTarget onHover={onHover} onSelect={onSelect} />
    </group>
  )
}
