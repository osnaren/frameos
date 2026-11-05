import { useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { Basin, DestinationTarget } from './Basin'
import { useWorldPalette } from '../../kit/context'

import type { DestinationProps } from '../../kit/types'

/**
 * Sacred Geometry's destination: a stepped tower.
 *
 * Stone, ritual and repetition — so it is built by repetition: one course
 * repeated eleven times, each smaller and slightly rotated, which is how the
 * real thing is made and also the cheapest possible geometry. A colonnade
 * rings the base, the courses climb, and the captured light sits in the
 * shrine at the top.
 */

const COURSES = 11

export function Temple({ arrival, hovered, onHover, onSelect }: DestinationProps) {
  const palette = useWorldPalette()
  const shrineRef = useRef<THREE.MeshStandardMaterial>(null)

  const courses = useMemo(
    () =>
      Array.from({ length: COURSES }, (_, index) => {
        const t = index / (COURSES - 1)
        return {
          key: index,
          y: 0.62 + index * 0.24,
          /* the taper is a curve, not a ramp: a tower that narrows evenly
             reads as a cone, and this is meant to read as courses */
          width: THREE.MathUtils.lerp(1.55, 0.34, Math.pow(t, 0.78)),
          height: 0.2,
          twist: index * 0.035,
        }
      }),
    []
  )

  const columns = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        return { key: index, x: Math.cos(angle) * 1.72, z: Math.sin(angle) * 1.72 }
      }),
    []
  )

  useFrame((state) => {
    if (shrineRef.current) {
      const emphasis = Math.max(arrival, hovered ? 0.9 : 0)
      const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(state.clock.getElapsedTime() * 0.7))
      shrineRef.current.emissiveIntensity = (0.35 + emphasis * 1.6) * pulse
    }
  })

  return (
    <group>
      {/* the platform, and the stair the route arrives up */}
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.6, 0.32, 4.6]} />
        <meshStandardMaterial color={palette.built} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.44, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.9, 0.26, 3.9]} />
        <meshStandardMaterial color={palette.lit} roughness={0.82} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[0, 0.09 + index * 0.12, 2.5 + index * 0.34]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[1.5 - index * 0.16, 0.12, 0.34]} />
          <meshStandardMaterial color={palette.cut} roughness={0.85} />
        </mesh>
      ))}

      {/* the colonnade */}
      {columns.map((column) => (
        <mesh key={column.key} position={[column.x, 0.78, column.z]} castShadow>
          <cylinderGeometry args={[0.07, 0.085, 0.62, 8]} />
          <meshStandardMaterial color={palette.built} roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[0, 1.14, 0]} castShadow>
        <torusGeometry args={[1.72, 0.05, 6, 24]} />
        <meshStandardMaterial color={palette.cut} roughness={0.84} />
      </mesh>

      {/* the courses */}
      {courses.map((course) => (
        <mesh
          key={course.key}
          position={[0, course.y, 0]}
          rotation={[0, course.twist, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[course.width, course.height, course.width]} />
          <meshStandardMaterial
            color={course.key % 3 === 0 ? palette.lit : palette.built}
            roughness={0.84}
          />
        </mesh>
      ))}

      {/* one painted course, the way a shrine is marked */}
      <mesh position={[0, 0.62 + 3 * 0.24, 0]} rotation={[0, 3 * 0.035, 0]} castShadow>
        <boxGeometry args={[1.12, 0.09, 1.12]} />
        <meshStandardMaterial color={palette.mark} roughness={0.76} />
      </mesh>

      {/* the shrine at the top, holding the light */}
      <mesh position={[0, 0.62 + COURSES * 0.24 + 0.14, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          ref={shrineRef}
          color={palette.routeCore}
          emissive={palette.routeCore}
          emissiveIntensity={0.5}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.62 + COURSES * 0.24 + 0.4, 0]} castShadow>
        <coneGeometry args={[0.22, 0.34, 4]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>

      <Basin position={[1.5, 0.6, 1.5]} radius={0.3} arrival={arrival} hovered={hovered} />
      <DestinationTarget onHover={onHover} onSelect={onSelect} radius={2.8} height={4.6} />
    </group>
  )
}
