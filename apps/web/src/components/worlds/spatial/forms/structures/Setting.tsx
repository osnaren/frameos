import { useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Basin, DestinationTarget } from './Basin'
import { useWorldPalette } from '../../kit/context'

import type { DestinationProps } from '../../kit/types'

/**
 * Table Notes' destination: a place laid at a table.
 *
 * "Meals worth interrupting." The other worlds are landscapes seen from
 * above; this one is the same view of a tabletop, which is the joke the world
 * is built on — at model scale a set table *is* a landscape. A round top on
 * turned legs, a stack of plates, a lamp above, and the captured light in the
 * lamp. The basin here is the dish itself.
 */
export function Setting({ arrival, hovered, onHover, onSelect }: DestinationProps) {
  const palette = useWorldPalette()
  const lampRef = useRef<THREE.MeshStandardMaterial>(null)

  const stack = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        key: index,
        y: 1.06 + index * 0.045,
        radius: 0.34 - index * 0.012,
      })),
    []
  )

  useFrame((state) => {
    if (lampRef.current) {
      const emphasis = Math.max(arrival, hovered ? 0.9 : 0)
      const glow = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(state.clock.getElapsedTime() * 0.6))
      lampRef.current.emissiveIntensity = (0.45 + emphasis * 1.7) * glow
    }
  })

  return (
    <group>
      {/* legs */}
      {[
        [-1.0, -1.0],
        [1.0, -1.0],
        [-1.0, 1.0],
        [1.0, 1.0],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.48, z]} castShadow>
          <cylinderGeometry args={[0.055, 0.075, 0.96, 8]} />
          <meshStandardMaterial color={palette.cutDeep} roughness={0.86} />
        </mesh>
      ))}

      {/* the top */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.75, 0.1, 40]} />
        <meshStandardMaterial color={palette.built} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.62, 1.62, 0.02, 40]} />
        <meshStandardMaterial color={palette.lit} roughness={0.78} />
      </mesh>

      {/* the stack of plates */}
      {stack.map((plate) => (
        <mesh key={plate.key} position={[-0.72, plate.y, 0.52]} castShadow receiveShadow>
          <cylinderGeometry args={[plate.radius, plate.radius * 0.94, 0.04, 28]} />
          <meshStandardMaterial
            color={plate.key % 2 === 0 ? palette.lit : palette.built}
            roughness={0.62}
          />
        </mesh>
      ))}

      {/* a cup and its saucer */}
      <mesh position={[0.82, 1.08, -0.42]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.21, 0.03, 24]} />
        <meshStandardMaterial color={palette.lit} roughness={0.62} />
      </mesh>
      <mesh position={[0.82, 1.18, -0.42]} castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.17, 18]} />
        <meshStandardMaterial color={palette.built} roughness={0.6} />
      </mesh>

      {/* the lamp above, and the light in it */}
      <mesh position={[0.24, 2.2, 0.1]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
        <meshStandardMaterial color={palette.cutDeep} roughness={0.85} />
      </mesh>
      <mesh position={[0.24, 1.72, 0.1]} castShadow>
        <coneGeometry args={[0.34, 0.3, 22, 1, true]} />
        <meshStandardMaterial color={palette.mark} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.24, 1.62, 0.1]}>
        <sphereGeometry args={[0.11, 14, 12]} />
        <meshStandardMaterial
          ref={lampRef}
          color={palette.routeCore}
          emissive={palette.routeCore}
          emissiveIntensity={0.6}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* the dish, which is this world's basin */}
      <Basin position={[0.24, 1.07, 0.62]} radius={0.42} arrival={arrival} hovered={hovered} />
      <DestinationTarget onHover={onHover} onSelect={onSelect} radius={2.4} height={3.6} />
    </group>
  )
}
