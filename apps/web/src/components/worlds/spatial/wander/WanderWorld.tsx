import { useEffect, useMemo, useRef } from 'react'

import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

import { getLocalVariantUrl } from '@/lib/local-photos'

import {
  FALLS,
  HEADLAND,
  LAGOON,
  buildRouteCurve,
  buildTerrainGeometry,
  scatterOnGrass,
  terrainHeight,
} from './terrain'
import { createCloudTexture, createGlowTexture } from '../journey/textures'

import type { WanderProgress } from './types'

/**
 * The Wander diorama: one handcrafted miniature travel landscape.
 *
 * Everything is sculpted or procedural in a single stylized system — sand,
 * grass and rock painted as vertex colors on an authored heightfield, a
 * lagoon with foam rolling toward the beach, a waterfall falling from the
 * plateau, wind-swayed palms, drifting clouds — and the light route embedded
 * in the terrain, ending at a small stone portal on the headland where the
 * sea photograph waits. The photograph lives inside the world; the world
 * would still stand without it.
 */

/* ---------- water ---------- */

const waterVertex = /* glsl */ `
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
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    float shoreDist = distance(vWorld.xz, uCenter);

    /* deep at the center, shallow aqua toward the sand */
    vec3 color = mix(uDeep, uShallow, smoothstep(0.2, 1.35, shoreDist));

    /* foam rings rolling outward toward the beach */
    float wobble = 0.14 * sin(atan(vWorld.z - uCenter.y, vWorld.x - uCenter.x) * 5.0 + uTime * 0.4);
    float band = fract((shoreDist + wobble) * 1.55 - uTime * 0.13);
    float foam = smoothstep(0.84, 0.96, band) * smoothstep(1.0, 0.93, band);
    /* foam belongs to the shallows near the sand, not the whole pool */
    foam *= smoothstep(uFade - 1.05, uFade - 0.35, shoreDist);
    color = mix(color, uFoam, foam * 0.85);

    /* one broad, slow shimmer band */
    color += 0.03 * sin(shoreDist * 3.0 - uTime * 0.5);

    float alpha = 0.88 * (1.0 - smoothstep(uFade - 0.55, uFade, shoreDist));
    gl_FragColor = vec4(color, alpha);
  }
`

function Lagoon() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#5da3a6') },
      uShallow: { value: new THREE.Color('#a9dcd2') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uCenter: { value: new THREE.Vector2(LAGOON.x, LAGOON.z) },
      uFade: { value: 1.68 },
    }),
    []
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[LAGOON.x, 0.015, LAGOON.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.9, 48]} />
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

/* ---------- waterfall ---------- */

const fallsFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    /* columns of falling water, each slightly out of phase */
    float column = floor(vUv.x * 6.0);
    float phase = fract(vUv.y * 1.7 - uTime * 0.6 + column * 0.17);
    float streak = smoothstep(0.0, 0.2, phase) * smoothstep(0.7, 0.35, phase);
    float body = smoothstep(0.02, 0.24, vUv.x) * smoothstep(0.98, 0.76, vUv.x);
    float head = smoothstep(1.0, 0.88, vUv.y);
    float foot = smoothstep(0.0, 0.2, vUv.y);
    vec3 color = mix(vec3(0.82, 0.9, 0.92), vec3(1.0), streak);
    gl_FragColor = vec4(color, body * head * foot * (0.5 + streak * 0.42));
  }
`

function MistPuff({ position }: { position: [number, number, number] }) {
  const spriteRef = useRef<THREE.Sprite>(null)
  const texture = useMemo(() => createCloudTexture(128, 91), [])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((state) => {
    if (spriteRef.current) {
      const time = state.clock.getElapsedTime()
      spriteRef.current.material.opacity = 0.34 + 0.1 * Math.sin(time * 1.1)
      spriteRef.current.scale.setScalar(0.5 + 0.06 * Math.sin(time * 0.8))
    }
  })

  return (
    <sprite ref={spriteRef} position={position} scale={0.5}>
      <spriteMaterial map={texture} color="#ffffff" transparent depthWrite={false} />
    </sprite>
  )
}

function Waterfall() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  const top = terrainHeight(FALLS.x - 0.08, FALLS.z - 0.35) - 0.06
  const bottom = 0.12
  const height = top - bottom

  return (
    <group>
      <mesh
        position={[FALLS.x - 0.02, bottom + height / 2, FALLS.z + 0.5]}
        rotation={[-0.12, 0.05, 0]}
      >
        <planeGeometry args={[0.4, height, 1, 12]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={waterVertex}
          fragmentShader={fallsFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* mist at the plunge */}
      <MistPuff position={[FALLS.poolX, 0.22, FALLS.poolZ + 0.15]} />
      {/* plunge pool */}
      <mesh position={[FALLS.poolX, 0.1, FALLS.poolZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.44, 28]} />
        <meshStandardMaterial color="#8fc4c0" transparent opacity={0.85} roughness={0.25} />
      </mesh>
    </group>
  )
}

/* ---------- vegetation ---------- */

function Tree({
  position,
  scale,
  rotation,
  swayRef,
}: {
  position: [number, number, number]
  scale: number
  rotation: number
  swayRef: (node: THREE.Group | null) => void
}) {
  /* canopy of clustered flattened blobs - the diorama tree vocabulary */
  const canopy = useMemo(
    () => [
      { offset: [0, 0.66, 0] as const, size: 0.21, color: '#5d8a4c' },
      { offset: [0.13, 0.58, 0.05] as const, size: 0.15, color: '#517a43' },
      { offset: [-0.11, 0.6, -0.06] as const, size: 0.14, color: '#6b9a58' },
      { offset: [0.02, 0.55, 0.12] as const, size: 0.12, color: '#4c7340' },
    ],
    []
  )

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0.05]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.05, 0.58, 6]} />
        <meshStandardMaterial color="#8a6f52" roughness={0.9} />
      </mesh>
      <group ref={swayRef}>
        {canopy.map((blob) => (
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

function Vegetation({ quality }: { quality: 'full' | 'lite' }) {
  const palmSpots = useMemo(() => scatterOnGrass(quality === 'full' ? 9 : 5, 11, 0.17), [quality])
  const bushSpots = useMemo(() => scatterOnGrass(quality === 'full' ? 14 : 7, 47, 0.16), [quality])
  const swayRefs = useRef<Array<THREE.Group | null>>([])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    swayRefs.current.forEach((group, index) => {
      if (group) {
        group.rotation.z = 0.03 * Math.sin(time * 0.8 + index * 1.7)
        group.rotation.x = 0.02 * Math.sin(time * 0.6 + index * 2.3)
      }
    })
  })

  return (
    <>
      {palmSpots.map((spot, index) => (
        <Tree
          key={`palm-${spot.x.toFixed(2)}-${spot.z.toFixed(2)}`}
          position={[spot.x, spot.y - 0.02, spot.z]}
          scale={spot.scale}
          rotation={spot.rotation}
          swayRef={(node) => {
            swayRefs.current[index] = node
          }}
        />
      ))}
      {bushSpots.map((spot) => (
        <mesh
          key={`bush-${spot.x.toFixed(2)}-${spot.z.toFixed(2)}`}
          position={[spot.x, spot.y + 0.05 * spot.scale, spot.z]}
          scale={[spot.scale * 0.16, spot.scale * 0.11, spot.scale * 0.16]}
          castShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={spot.rotation > Math.PI ? '#6f9c58' : '#5d8a4c'}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </>
  )
}

/* ---------- the light route ---------- */

const routeVertex = /* glsl */ `
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vAlong = uv.x;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const routeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHead;
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float edge = pow(abs(dot(vNormal, vViewDir)), 1.35);
    float flow = 0.85 + 0.2 * sin(vAlong * 70.0 - uTime * 1.8);
    float lit = 1.0 - smoothstep(uHead, uHead + 0.06, vAlong);
    float promise = 0.16 * (1.0 - smoothstep(uHead + 0.06, uHead + 0.4, vAlong));
    float alpha = edge * flow * max(lit, promise);
    vec3 color = mix(vec3(1.0, 0.93, 0.72), vec3(1.0, 0.98, 0.9), flow);
    gl_FragColor = vec4(color, alpha);
  }
`

function LightRoute({ progress }: { progress: WanderProgress }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const glowRef = useRef<THREE.ShaderMaterial>(null)
  const headRef = useRef<THREE.Sprite>(null)

  const curve = useMemo(() => buildRouteCurve(), [])
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.02, 8, false), [curve])
  const glowTube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.055, 8, false), [curve])
  const glowTexture = useMemo(() => createGlowTexture(), [])

  useEffect(
    () => () => {
      tube.dispose()
      glowTube.dispose()
      glowTexture.dispose()
    },
    [tube, glowTube, glowTexture]
  )

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uHead: { value: 0 } }), [])
  const glowUniforms = useMemo(() => ({ uTime: { value: 0 }, uHead: { value: 0 } }), [])

  const introStart = useRef<number | null>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    /* on arrival, a point of light appears and traces the first stretch */
    if (introStart.current === null) {
      introStart.current = time
    }
    const introT = Math.min((time - (introStart.current ?? time)) / 2.4, 1)
    const intro = (1 - Math.pow(1 - introT, 3)) * 0.14

    const head = Math.max(THREE.MathUtils.clamp(progress.routeHead, 0, 1), intro)

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
      materialRef.current.uniforms.uHead.value = head
    }
    if (glowRef.current) {
      glowRef.current.uniforms.uTime.value = time
      glowRef.current.uniforms.uHead.value = head
    }
    if (headRef.current) {
      headRef.current.position.copy(curve.getPointAt(Math.min(Math.max(head - 0.01, 0), 0.999)))
      headRef.current.position.y += 0.05
      headRef.current.scale.setScalar(0.11 + 0.015 * Math.sin(time * 2.6))
      headRef.current.material.opacity = 0.85 * (1 - Math.abs(head - 1) < 0.02 ? 0.3 : 1)
    }
  })

  return (
    <group>
      <mesh geometry={tube}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={routeVertex}
          fragmentShader={routeFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={glowTube}>
        <shaderMaterial
          ref={glowRef}
          vertexShader={routeVertex}
          fragmentShader={routeFragment}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.4}
        />
      </mesh>
      <sprite ref={headRef}>
        <spriteMaterial
          map={glowTexture}
          color="#fff2cf"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}

/* ---------- the portal on the headland ---------- */

function Portal({
  progress,
  onHover,
  onSelect,
}: {
  progress: WanderProgress
  onHover: (hovered: boolean) => void
  onSelect: () => void
}) {
  const glowRef = useRef<THREE.Sprite>(null)
  const photoRef = useRef<THREE.MeshBasicMaterial>(null)
  const glowTexture = useMemo(() => createGlowTexture(), [])
  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  const seaUrl = useMemo(() => getLocalVariantUrl('local/the-sea', 768) ?? '', [])
  const seaTexture = useLoader(THREE.TextureLoader, seaUrl)

  useEffect(() => {
    seaTexture.colorSpace = THREE.SRGBColorSpace
    seaTexture.anisotropy = 4
    /* crop the wide sea photograph to the upright portal opening */
    const portalAspect = 0.36 / 0.52
    const imageAspect = 2048 / 1153
    seaTexture.repeat.set(portalAspect / imageAspect, 1)
    seaTexture.offset.set((1 - portalAspect / imageAspect) / 2, 0)
  }, [seaTexture])

  const y = terrainHeight(HEADLAND.x, HEADLAND.z)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (glowRef.current) {
      const emphasis = progress.portalHovered ? 0.5 : 0.25 + 0.3 * progress.arrival
      glowRef.current.material.opacity = emphasis + 0.05 * Math.sin(time * 1.9)
      glowRef.current.scale.setScalar(
        0.7 + progress.arrival * 0.25 + (progress.portalHovered ? 0.12 : 0)
      )
    }
    if (photoRef.current) {
      const target = progress.portalHovered ? 1 : 0.82 + progress.arrival * 0.1
      photoRef.current.opacity += (target - photoRef.current.opacity) * 0.08
    }
  })

  return (
    <group position={[HEADLAND.x, y - 0.03, HEADLAND.z]} rotation={[0, -0.85, 0]}>
      {/* weathered stone frame */}
      {[-0.21, 0.21].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} castShadow>
          <boxGeometry args={[0.06, 0.6, 0.08]} />
          <meshStandardMaterial color="#aaa294" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.54, 0.06, 0.1]} />
        <meshStandardMaterial color="#9c9486" roughness={0.95} />
      </mesh>
      {/* the photograph, waiting inside the arch */}
      <mesh position={[0, 0.31, 0]}>
        <planeGeometry args={[0.36, 0.52]} />
        <meshBasicMaterial ref={photoRef} map={seaTexture} transparent toneMapped={false} />
      </mesh>
      <sprite ref={glowRef} position={[0, 0.36, -0.15]}>
        <spriteMaterial
          map={glowTexture}
          color="#ffedbe"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* generous hit target — invisible material, but raycastable */}
      <mesh
        position={[0, 0.36, 0.05]}
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
        <planeGeometry args={[0.9, 1.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* small cairn stones beside the portal */}
      {[
        [-0.44, 0.04, 0.18, 0.07],
        [0.42, 0.03, 0.24, 0.055],
        [0.5, 0.025, 0.1, 0.04],
      ].map(([x, yOff, z, size]) => (
        <mesh key={`${x}:${z}`} position={[x, yOff, z]} castShadow>
          <icosahedronGeometry args={[size, 0]} />
          <meshStandardMaterial color="#948a78" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- sky life ---------- */

function Clouds({ quality }: { quality: 'full' | 'lite' }) {
  const seeds = useMemo(() => {
    const count = quality === 'full' ? 9 : 5
    return Array.from({ length: count }, (_, index) => ({
      key: index,
      position: [
        Math.cos((index / count) * Math.PI * 2) * (8.5 + (index % 3) * 1.6),
        -1.2 + (index % 4) * 1.5,
        Math.sin((index / count) * Math.PI * 2) * (8.5 + ((index + 1) % 3) * 1.6),
      ] as [number, number, number],
      scale: 3.0 + (index % 3) * 1.4,
      seed: index * 13 + 5,
    }))
  }, [quality])

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
          ref={(node: THREE.Sprite | null) => {
            refs.current[index] = node
          }}
        >
          <spriteMaterial map={textures[index]} color="#e7e4d8" transparent depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}

function DistantIsles() {
  return (
    <>
      {[
        [-11, 0.3, -7, 2.8, 0.8],
        [9.5, 0.7, -9, 3.4, 1.1],
        [12, 0.0, -3, 2.2, 0.6],
      ].map(([x, y, z, w, h]) => (
        <mesh key={`${x}:${z}`} position={[x, y, z]} scale={[w, h, w * 0.8]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#ccd8da" transparent opacity={0.5} fog />
        </mesh>
      ))}
    </>
  )
}

/** One restrained aircraft moment: a tiny plane crossing the far sky. */
function Aircraft() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) {
      return
    }
    const period = 34
    const t = (state.clock.getElapsedTime() % period) / period
    const visible = t > 0.15 && t < 0.6
    const k = (t - 0.15) / 0.45
    groupRef.current.position.set(-16 + k * 32, 5.4 + Math.sin(k * Math.PI) * 0.7, -13)
    groupRef.current.visible = visible
    const fade = Math.sin(Math.min(Math.max(k, 0), 1) * Math.PI)
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial
        material.opacity = 0.75 * fade
      }
    })
  })

  return (
    <group ref={groupRef} rotation={[0, 0.06, 0.02]}>
      <mesh>
        <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
        <meshStandardMaterial color="#e8ecef" transparent roughness={0.4} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.01, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.09]} />
        <meshStandardMaterial color="#dfe4e8" transparent roughness={0.4} />
      </mesh>
    </group>
  )
}

/* ---------- assembly ---------- */

export function WanderWorld({
  progress,
  quality,
  onPortalHover,
  onPortalSelect,
}: {
  progress: WanderProgress
  quality: 'full' | 'lite'
  onPortalHover: (hovered: boolean) => void
  onPortalSelect: () => void
}) {
  const terrainGeometry = useMemo(
    () => buildTerrainGeometry(quality === 'full' ? 168 : 120),
    [quality]
  )
  useEffect(() => () => terrainGeometry.dispose(), [terrainGeometry])

  return (
    <group>
      <mesh geometry={terrainGeometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
      </mesh>

      {/* the island's rocky underside — present, but never the subject */}
      <mesh position={[0, -1.6, 0]}>
        <coneGeometry args={[4.5, 3.0, 26, 4]} />
        <meshStandardMaterial color="#6b5f4d" roughness={0.98} flatShading />
      </mesh>

      <Lagoon />
      <Waterfall />
      <Vegetation quality={quality} />
      <LightRoute progress={progress} />
      <Portal progress={progress} onHover={onPortalHover} onSelect={onPortalSelect} />
      <Clouds quality={quality} />
      <DistantIsles />
      {quality === 'full' ? <Aircraft /> : null}
    </group>
  )
}
