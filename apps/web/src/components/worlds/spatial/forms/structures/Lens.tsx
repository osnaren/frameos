import { useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Basin, DestinationTarget } from './Basin'
import { useWorldPalette } from '../../kit/context'

import type { DestinationProps } from '../../kit/types'

/**
 * Small Wonders' destination: a lens on a stand.
 *
 * "The closer you look, the larger it gets." So the destination is the act of
 * looking itself — a surveyor's glass on a tripod, set over a specimen plinth,
 * with the captured light gathered in the glass. It is the only structure in
 * the set that is an instrument rather than a building, which is the point.
 */
export function Lens({ arrival, hovered, onHover, onSelect }: DestinationProps) {
  const palette = useWorldPalette()
  const glassRef = useRef<THREE.MeshStandardMaterial>(null)
  const armRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime()
    const emphasis = Math.max(arrival, hovered ? 0.9 : 0)

    if (glassRef.current) {
      glassRef.current.emissiveIntensity =
        (0.3 + emphasis * 1.5) * (0.65 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.9)))
    }
    if (armRef.current) {
      /* the glass settles a fraction lower over the specimen on arrival, as
         if someone had just leaned in */
      const target = -0.12 * emphasis
      armRef.current.position.y += (target - armRef.current.position.y) * Math.min(delta * 3, 1)
    }
  })

  return (
    <group>
      {/* the specimen plinth */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.24, 24]} />
        <meshStandardMaterial color={palette.built} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.52, 0.6, 0.14, 24]} />
        <meshStandardMaterial color={palette.lit} roughness={0.8} />
      </mesh>

      {/* the specimen: one seed head, magnified by attention alone */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.28, 6]} />
        <meshStandardMaterial color={palette.cutDeep} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 14]} />
        <meshStandardMaterial color={palette.mid} roughness={0.9} />
      </mesh>

      {/* tripod */}
      {[0, 1, 2].map((index) => {
        const angle = (index / 3) * Math.PI * 2 + 0.4
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.72, 0.78, Math.sin(angle) * 0.72]}
            rotation={[Math.sin(angle) * 0.34, 0, -Math.cos(angle) * 0.34]}
            castShadow
          >
            <cylinderGeometry args={[0.026, 0.032, 1.5, 6]} />
            <meshStandardMaterial color={palette.built} roughness={0.84} />
          </mesh>
        )
      })}

      {/* the arm and the glass */}
      <group ref={armRef}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
          <meshStandardMaterial color={palette.cut} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.5, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.68, 8]} />
          <meshStandardMaterial color={palette.cut} roughness={0.8} />
        </mesh>

        {/* the ring */}
        <mesh position={[0, 1.5, 0.66]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.42, 0.035, 8, 28]} />
          <meshStandardMaterial color={palette.mark} roughness={0.7} />
        </mesh>
        {/* the glass itself, where the captured light gathers */}
        <mesh position={[0, 1.5, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.41, 28]} />
          <meshStandardMaterial
            ref={glassRef}
            color={palette.routeCore}
            emissive={palette.routeCore}
            emissiveIntensity={0.4}
            transparent
            opacity={0.42}
            roughness={0.25}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Basin position={[1.15, 0.06, -0.85]} radius={0.28} arrival={arrival} hovered={hovered} />
      <DestinationTarget onHover={onHover} onSelect={onSelect} radius={1.9} height={3.2} />
    </group>
  )
}
