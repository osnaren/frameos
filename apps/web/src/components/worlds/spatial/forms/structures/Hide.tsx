import { useRef } from 'react'

import { useFrame } from '@react-three/fiber'

import { Basin, DestinationTarget } from './Basin'
import { useWorldPalette } from '../../kit/context'

import type { DestinationProps } from '../../kit/types'
import type * as THREE from 'three'

/**
 * Living Things' destination: a birdwatcher's hide.
 *
 * "Company that chooses its own distance." So the destination is a place to
 * wait quietly: a timber hide raised on stilts over the marsh, with a
 * viewing slot facing the water and a boardwalk running out to it. The
 * captured light sits behind the slot — someone is in there, watching.
 */
export function Hide({ arrival, hovered, onHover, onSelect }: DestinationProps) {
  const palette = useWorldPalette()
  const slotRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((state) => {
    if (slotRef.current) {
      const emphasis = Math.max(arrival, hovered ? 0.9 : 0)
      const flicker = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(state.clock.getElapsedTime() * 1.1))
      slotRef.current.emissiveIntensity = (0.3 + emphasis * 1.4) * flicker
    }
  })

  const stilts: Array<[number, number]> = [
    [-0.62, -0.5],
    [0.62, -0.5],
    [-0.62, 0.5],
    [0.62, 0.5],
  ]

  return (
    <group>
      {/* the boardwalk out to it, on its own little piles */}
      {[0, 1, 2, 3, 4].map((index) => (
        <group key={index} position={[0, 0, 1.3 + index * 0.72]}>
          <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.78, 0.06, 0.72]} />
            <meshStandardMaterial color={palette.built} roughness={0.86} />
          </mesh>
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} position={[x, 0.24, 0]} castShadow>
              <cylinderGeometry args={[0.026, 0.026, 0.56, 6]} />
              <meshStandardMaterial color={palette.cutDeep} roughness={0.88} />
            </mesh>
          ))}
        </group>
      ))}

      {/* stilts */}
      {stilts.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.34, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.78, 7]} />
          <meshStandardMaterial color={palette.cutDeep} roughness={0.88} />
        </mesh>
      ))}

      {/* the deck */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.62, 0.09, 1.32]} />
        <meshStandardMaterial color={palette.built} roughness={0.86} />
      </mesh>

      {/* the hut: two walls, a dark viewing slot, a pitched roof */}
      <mesh position={[0, 1.18, -0.28]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.76, 0.6]} />
        <meshStandardMaterial color={palette.lit} roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.24, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.64, 0.12]} />
        <meshStandardMaterial color={palette.built} roughness={0.86} />
      </mesh>

      {/* the slot, and the light behind it */}
      <mesh position={[0, 1.3, 0.14]}>
        <boxGeometry args={[1.06, 0.17, 0.03]} />
        <meshStandardMaterial
          ref={slotRef}
          color={palette.routeCore}
          emissive={palette.routeCore}
          emissiveIntensity={0.4}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* roof */}
      <mesh position={[0, 1.64, -0.14]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.16, 0.42, 4]} />
        <meshStandardMaterial color={palette.mark} roughness={0.82} />
      </mesh>

      {/* a marker post at the end of the walk */}
      <mesh position={[0.86, 0.86, 1.5]} castShadow>
        <cylinderGeometry args={[0.03, 0.036, 0.72, 6]} />
        <meshStandardMaterial color={palette.cutDeep} roughness={0.88} />
      </mesh>

      <Basin position={[-1.25, 0.02, 0.9]} radius={0.34} arrival={arrival} hovered={hovered} />
      <DestinationTarget onHover={onHover} onSelect={onSelect} radius={2.1} height={3.4} />
    </group>
  )
}
