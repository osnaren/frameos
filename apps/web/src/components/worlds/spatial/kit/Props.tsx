import { useEffect, useMemo, useRef } from 'react'

import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

import { getLocalVariantUrl } from '@/lib/local-photos'

import { createCloudTexture, createGlowTexture } from './textures'

/**
 * Shared diorama props for every Pocket World: stylised trees and rocks,
 * drifting clouds, distant haze isles, ground haze, water, and the stone
 * portal that holds a world's photograph. One cohesive miniature vocabulary
 * so all five islands read as a single handcrafted set.
 */

/* ---------- vegetation ---------- */

export function Tree({
  position,
  scale,
  rotation,
  swayRef,
  trunk = '#8a6f52',
  canopy = ['#5d8a4c', '#517a43', '#6b9a58', '#4c7340'],
}: {
  position: [number, number, number]
  scale: number
  rotation: number
  swayRef?: (node: THREE.Group | null) => void
  trunk?: string
  canopy?: [string, string, string, string]
}) {
  const blobs = useMemo(
    () => [
      { offset: [0, 0.66, 0] as const, size: 0.21, color: canopy[0] },
      { offset: [0.13, 0.58, 0.05] as const, size: 0.15, color: canopy[1] },
      { offset: [-0.11, 0.6, -0.06] as const, size: 0.14, color: canopy[2] },
      { offset: [0.02, 0.55, 0.12] as const, size: 0.12, color: canopy[3] },
    ],
    [canopy]
  )

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0.05]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.05, 0.58, 6]} />
        <meshStandardMaterial color={trunk} roughness={0.9} />
      </mesh>
      <group ref={swayRef}>
        {blobs.map((blob) => (
          <mesh
            key={blob.offset.join(':')}
            position={[blob.offset[0], blob.offset[1], blob.offset[2]]}
            scale={[1, 0.72, 1]}
            castShadow
          >
            <icosahedronGeometry args={[blob.size, 1]} />
            <meshStandardMaterial color={blob.color} roughness={0.92} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Bush({
  position,
  scale,
  color,
}: {
  position: [number, number, number]
  scale: number
  color: string
}) {
  return (
    <mesh position={position} scale={[scale * 0.16, scale * 0.11, scale * 0.16]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  )
}

export function Rock({
  position,
  size,
  color = '#948a78',
}: {
  position: [number, number, number]
  size: number
  color?: string
}) {
  return (
    <mesh position={position} castShadow>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  )
}

/* ---------- sky ---------- */

export function Clouds({
  count,
  color = '#e7e4d8',
  spread = 9,
  height = 2,
}: {
  count: number
  color?: string
  spread?: number
  height?: number
}) {
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        key: index,
        position: [
          Math.cos((index / count) * Math.PI * 2) * (spread + (index % 3) * 1.6),
          -1.2 + (index % 4) * height,
          Math.sin((index / count) * Math.PI * 2) * (spread + ((index + 1) % 3) * 1.6),
        ] as [number, number, number],
        scale: 3.0 + (index % 3) * 1.4,
        seed: index * 13 + 5,
      })),
    [count, spread, height]
  )

  const textures = useMemo(() => seeds.map((seed) => createCloudTexture(256, seed.seed)), [seeds])
  const refs = useRef<Array<THREE.Sprite | null>>([])
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures])

  useFrame((state, delta) => {
    refs.current.forEach((sprite, index) => {
      if (!sprite) {
        return
      }
      sprite.position.x += (0.018 + (index % 3) * 0.007) * delta * (index % 2 === 0 ? 1 : -1)
      sprite.material.opacity =
        0.44 + 0.07 * Math.sin(state.clock.getElapsedTime() * 0.25 + index * 2.1)
    })
  })

  return (
    <>
      {seeds.map((seed, index) => (
        <sprite
          key={seed.key}
          position={seed.position}
          scale={seed.scale}
          ref={(node) => {
            refs.current[index] = node
          }}
        >
          <spriteMaterial map={textures[index]} color={color} transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}

export function DistantIsles({
  isles,
  color = '#ccd8da',
}: {
  isles: Array<[number, number, number, number, number]>
  color?: string
}) {
  return (
    <>
      {isles.map(([x, y, z, w, h]) => (
        <mesh key={`${x}:${z}`} position={[x, y, z]} scale={[w, h, w * 0.8]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} fog />
        </mesh>
      ))}
    </>
  )
}

export function GroundHaze({ color, radius = 2.2 }: { color: string; radius?: number }) {
  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 40]} />
      <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
    </mesh>
  )
}

/* ---------- water ---------- */

export const waterVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform vec2 uCenter;
  uniform float uFade;
  varying vec3 vWorld;

  void main() {
    float shoreDist = distance(vWorld.xz, uCenter);
    vec3 color = mix(uDeep, uShallow, smoothstep(0.2, 1.35, shoreDist));
    float wobble = 0.14 * sin(atan(vWorld.z - uCenter.y, vWorld.x - uCenter.x) * 5.0 + uTime * 0.4);
    float band = fract((shoreDist + wobble) * 1.55 - uTime * 0.13);
    float foam = smoothstep(0.84, 0.96, band) * smoothstep(1.0, 0.93, band);
    foam *= smoothstep(uFade - 1.05, uFade - 0.35, shoreDist);
    color = mix(color, uFoam, foam * 0.85);
    color += 0.03 * sin(shoreDist * 3.0 - uTime * 0.5);
    float alpha = 0.88 * (1.0 - smoothstep(uFade - 0.55, uFade, shoreDist));
    gl_FragColor = vec4(color, alpha);
  }
`

export function Water({
  center,
  radius,
  fade,
  deep = '#5da3a6',
  shallow = '#a9dcd2',
}: {
  center: [number, number]
  radius: number
  fade: number
  deep?: string
  shallow?: string
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(deep) },
      uShallow: { value: new THREE.Color(shallow) },
      uFoam: { value: new THREE.Color('#ffffff') },
      uCenter: { value: new THREE.Vector2(center[0], center[1]) },
      uFade: { value: fade },
    }),
    [center, deep, shallow, fade]
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[center[0], 0.015, center[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* ---------- the portal that holds a world's photograph ---------- */

const HERO_ASPECT: Record<string, number> = {
  'the-sea': 2048 / 1153,
  'tower-and-sky': 1469 / 1958,
  'leaf-after-rain': 1469 / 1958,
  parakeet: 1956 / 1958,
  'banana-leaf-meal': 2048 / 1153,
}

/**
 * A weathered stone arch on the island, framing the world's hero photograph.
 * The photograph lives inside the world; the diorama stands without it. The
 * generous invisible hit-plane makes the whole arch the entry hotspot.
 */
export function Portal({
  heroId,
  accent,
  hovered,
  arrival,
  onHover,
  onSelect,
  frameWidth = 0.42,
  frameHeight = 0.62,
}: {
  heroId: string
  accent: string
  hovered: boolean
  arrival: number
  onHover: (hovered: boolean) => void
  onSelect: () => void
  frameWidth?: number
  frameHeight?: number
}) {
  const glowRef = useRef<THREE.Sprite>(null)
  const photoRef = useRef<THREE.MeshBasicMaterial>(null)
  const glowTexture = useMemo(() => createGlowTexture(), [])
  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  const url = useMemo(() => getLocalVariantUrl(`local/${heroId}`, 768) ?? '', [heroId])
  const texture = useLoader(THREE.TextureLoader, url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    /* cover-crop the photograph into the portal opening */
    const portalAspect = frameWidth / frameHeight
    const imageAspect = HERO_ASPECT[heroId] ?? 1
    if (imageAspect > portalAspect) {
      texture.repeat.set(portalAspect / imageAspect, 1)
      texture.offset.set((1 - portalAspect / imageAspect) / 2, 0)
    } else {
      texture.repeat.set(1, imageAspect / portalAspect)
      texture.offset.set(0, (1 - imageAspect / portalAspect) / 2)
    }
  }, [texture, heroId, frameWidth, frameHeight])

  const jamb = frameWidth / 2 + 0.03
  const top = frameHeight + 0.02

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (glowRef.current) {
      const emphasis = hovered ? 0.55 : 0.24 + 0.3 * arrival
      glowRef.current.material.opacity = emphasis + 0.05 * Math.sin(time * 1.9)
      glowRef.current.scale.setScalar(0.8 + arrival * 0.28 + (hovered ? 0.14 : 0))
    }
    if (photoRef.current) {
      const target = hovered ? 1 : 0.82 + arrival * 0.12
      photoRef.current.opacity += (target - photoRef.current.opacity) * 0.08
    }
  })

  return (
    <group>
      {[-jamb, jamb].map((x) => (
        <mesh key={x} position={[x, frameHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.06, frameHeight, 0.08]} />
          <meshStandardMaterial color="#aaa294" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, top, 0]} castShadow>
        <boxGeometry args={[frameWidth + 0.18, 0.06, 0.1]} />
        <meshStandardMaterial color="#9c9486" roughness={0.95} />
      </mesh>
      <mesh position={[0, frameHeight / 2, 0]}>
        <planeGeometry args={[frameWidth, frameHeight]} />
        <meshBasicMaterial ref={photoRef} map={texture} transparent toneMapped={false} />
      </mesh>
      <sprite ref={glowRef} position={[0, frameHeight / 2 + 0.05, -0.15]}>
        <spriteMaterial
          map={glowTexture}
          color={accent}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh
        position={[0, frameHeight / 2 + 0.05, 0.05]}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          onHover(true)
        }}
        onPointerOut={() => onHover(false)}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <planeGeometry args={[frameWidth + 0.5, frameHeight + 0.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
