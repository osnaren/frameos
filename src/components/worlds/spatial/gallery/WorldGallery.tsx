import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { Link } from '@tanstack/react-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { buildCloudinaryImageUrl } from '@/lib/image-policy'
import { getLocalVariantUrl } from '@/lib/local-photos'

import type { WorldDefinition } from '@/content/worlds'
import type { Photo } from '@/types/photo'

function textureUrl(publicId: string, quality: 'full' | 'lite') {
  const local = getLocalVariantUrl(publicId, quality === 'full' ? 768 : 480)
  if (local) return local

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloudName) return ''

  return buildCloudinaryImageUrl({
    cloudName,
    publicId,
    preset: 'spatial',
    width: quality === 'full' ? 768 : 480,
  })
}

const PLANET_RADIUS = 4.05

function PlanetSurface({ world, quality }: { world: WorldDefinition; quality: 'full' | 'lite' }) {
  const geometry = useMemo(() => {
    const surface = new THREE.IcosahedronGeometry(PLANET_RADIUS, quality === 'full' ? 5 : 3)
    const positions = surface.getAttribute('position')
    const colors: number[] = []
    const deep = new THREE.Color(world.mood.deep)
    const accent = new THREE.Color(world.mood.accent)
    const mist = deep.clone().lerp(accent, 0.24)
    const vertex = new THREE.Vector3()

    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index)
      const direction = vertex.clone().normalize()
      const broad =
        Math.sin(direction.x * 5.7 + direction.z * 1.8) *
        Math.cos(direction.y * 6.3 - direction.x * 1.4)
      const detail = Math.sin((direction.x + direction.y + direction.z) * 18.0) * 0.28
      const displacement = (broad + detail) * (quality === 'full' ? 0.075 : 0.045)
      vertex.copy(direction).multiplyScalar(PLANET_RADIUS + displacement)
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z)

      const shade = THREE.MathUtils.clamp((displacement + 0.11) / 0.22, 0, 1)
      const color = deep.clone().lerp(shade > 0.56 ? mist : accent, shade * 0.42)
      colors.push(color.r, color.g, color.b)
    }

    surface.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    surface.computeVertexNormals()
    return surface
  }, [quality, world.mood.accent, world.mood.deep])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshPhysicalMaterial
        vertexColors
        roughness={0.82}
        metalness={0.08}
        clearcoat={0.18}
        clearcoatRoughness={0.72}
      />
    </mesh>
  )
}

function Atmosphere({ color }: { color: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(color) } },
        vertexShader: `
          varying vec3 worldNormal;
          varying vec3 worldPosition;
          void main() {
            worldNormal = normalize(mat3(modelMatrix) * normal);
            vec4 positionWorld = modelMatrix * vec4(position, 1.0);
            worldPosition = positionWorld.xyz;
            gl_Position = projectionMatrix * viewMatrix * positionWorld;
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying vec3 worldNormal;
          varying vec3 worldPosition;
          void main() {
            vec3 viewDirection = normalize(cameraPosition - worldPosition);
            float fresnel = pow(1.0 - max(dot(worldNormal, viewDirection), 0.0), 2.7);
            gl_FragColor = vec4(glowColor, fresnel * 0.5);
          }
        `,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  )

  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh scale={1.09} material={material}>
      <icosahedronGeometry args={[PLANET_RADIUS, 5]} />
    </mesh>
  )
}

function DustField({ color, quality }: { color: string; quality: 'full' | 'lite' }) {
  const points = useMemo(() => {
    const count = quality === 'full' ? 900 : 360
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const radius = 8 + ((index * 37) % 100) / 8
      const theta = index * 2.39996
      const y = (((index * 53) % 101) / 100 - 0.5) * 14
      values[index * 3] = Math.cos(theta) * radius
      values[index * 3 + 1] = y
      values[index * 3 + 2] = Math.sin(theta) * radius
    }
    return values
  }, [quality])

  const ref = useRef<THREE.Points>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={quality === 'full' ? 0.022 : 0.03}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function OrbitalHalo({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.012
  })

  return (
    <group ref={ref} rotation={[1.12, 0.18, 0.22]}>
      <mesh>
        <torusGeometry args={[5.18, 0.006, 8, 220]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh rotation={[0, 0, 0.38]}>
        <torusGeometry args={[5.5, 0.003, 8, 220]} />
        <meshBasicMaterial color="#fff1d2" transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Controls({ quality }: { quality: 'full' | 'lite' }) {
  const { camera, gl } = useThree()
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl])
  const resumeAt = useRef(0)

  useEffect(() => {
    controls.enableDamping = true
    controls.dampingFactor = 0.045
    controls.enablePan = false
    controls.minDistance = 6.8
    controls.maxDistance = 12.5
    controls.minPolarAngle = Math.PI * 0.2
    controls.maxPolarAngle = Math.PI * 0.8
    controls.rotateSpeed = 0.42
    controls.zoomSpeed = 0.62
    controls.autoRotate = quality === 'full'
    controls.autoRotateSpeed = 0.22
    controls.target.set(0, 0, 0)

    const pause = () => {
      controls.autoRotate = false
      resumeAt.current = performance.now() + 5000
    }
    controls.addEventListener('start', pause)
    return () => {
      controls.removeEventListener('start', pause)
      controls.dispose()
    }
  }, [controls, quality])

  useFrame(() => {
    if (quality === 'full' && !controls.autoRotate && performance.now() > resumeAt.current) {
      controls.autoRotate = true
    }
    controls.update()
  })
  return null
}

function PhotoPlane({
  photo,
  position,
  quality,
  accent,
  onSelect,
  onFocus,
}: {
  photo: Photo
  position: THREE.Vector3
  quality: 'full' | 'lite'
  accent: string
  onSelect: (slug: string) => void
  onFocus: (photo: Photo | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const url = useMemo(() => textureUrl(photo.publicId, quality), [photo.publicId, quality])
  const texture = useLoader(THREE.TextureLoader, url)
  const { gl } = useThree()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy())
  }, [gl, texture])

  const aspect = Math.min(1.9, Math.max(0.52, photo.metadata.width / photo.metadata.height || 1))
  const longEdge = quality === 'full' ? 1.32 : 1.12
  const width = aspect >= 1 ? longEdge : longEdge * aspect
  const height = aspect >= 1 ? longEdge / aspect : longEdge
  const normal = useMemo(() => position.clone().normalize(), [position])
  const quaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
    [normal]
  )
  const restingPosition = useMemo(() => position.clone(), [position])
  const focusedPosition = useMemo(() => position.clone().multiplyScalar(1.022), [position])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const targetScale = hovered ? 1.085 : 1
    const easing = 1 - Math.exp(-delta * 9)
    const scale = THREE.MathUtils.lerp(group.scale.x, targetScale, easing)
    group.scale.setScalar(scale)
    group.position.lerp(hovered ? focusedPosition : restingPosition, easing)
  })

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      <mesh position={[0, 0, -0.075]} scale={hovered ? 1.08 : 1}>
        <planeGeometry args={[width + 0.32, height + 0.32]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={hovered ? 0.2 : 0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.12]} />
        <meshPhysicalMaterial
          color={hovered ? '#f7f0df' : '#d9d2c5'}
          roughness={0.28}
          metalness={0.18}
          clearcoat={0.5}
          clearcoatRoughness={0.35}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.064]}
        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          setHovered(true)
          onFocus(photo)
          gl.domElement.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          onFocus(null)
          gl.domElement.style.cursor = 'grab'
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          onSelect(photo.slug)
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.067]} raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={hovered ? 0.08 : 0.025}
          roughness={0.08}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function PhotoWorld({
  photos,
  world,
  quality,
  onSelect,
  onFocus,
}: {
  photos: Photo[]
  world: WorldDefinition
  quality: 'full' | 'lite'
  onSelect: (slug: string) => void
  onFocus: (photo: Photo | null) => void
}) {
  const positions = useMemo(() => {
    const count = photos.length
    const radius = PLANET_RADIUS + 0.2
    const golden = Math.PI * (3 - Math.sqrt(5))
    return photos.map((_, index) => {
      const y = 1 - ((index + 0.5) / Math.max(count, 1)) * 2
      const ring = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * index + 0.38
      return new THREE.Vector3(
        Math.cos(theta) * ring * radius,
        y * radius,
        Math.sin(theta) * ring * radius
      )
    })
  }, [photos])

  return (
    <group rotation={[0.08, -0.3, -0.035]}>
      <PlanetSurface world={world} quality={quality} />
      <Atmosphere color={world.mood.accent} />
      <OrbitalHalo color={world.mood.accent} />
      {photos.map((photo, index) => (
        <Suspense key={photo.slug} fallback={null}>
          <PhotoPlane
            photo={photo}
            position={positions[index]}
            quality={quality}
            accent={world.mood.accent}
            onSelect={onSelect}
            onFocus={onFocus}
          />
        </Suspense>
      ))}
    </group>
  )
}

function Scene({
  photos,
  world,
  quality,
  onSelect,
  onFocus,
}: {
  photos: Photo[]
  world: WorldDefinition
  quality: 'full' | 'lite'
  onSelect: (slug: string) => void
  onFocus: (photo: Photo | null) => void
}) {
  return (
    <>
      <color attach="background" args={[world.mood.deep]} />
      <fog attach="fog" args={[world.mood.deep, 11, 25]} />
      <hemisphereLight args={['#dce6e8', world.mood.deep, 0.72]} />
      <ambientLight intensity={0.34} />
      <spotLight
        position={[8, 10, 12]}
        intensity={5.2}
        angle={0.42}
        penumbra={0.85}
        color="#fff0d0"
        castShadow={quality === 'full'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-7, 1, -5]} intensity={18} distance={18} color={world.mood.accent} />
      <pointLight position={[2, -6, 4]} intensity={7} distance={14} color="#8ab6c4" />
      <DustField color={world.mood.accent} quality={quality} />
      <PhotoWorld
        photos={photos}
        world={world}
        quality={quality}
        onSelect={onSelect}
        onFocus={onFocus}
      />
      <Controls quality={quality} />
    </>
  )
}

class CanvasBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Spatial world gallery failed; restoring the photographic fallback.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function WorldGallery({
  photos,
  world,
  quality,
  onSelect,
  onError,
}: {
  photos: Photo[]
  world: WorldDefinition
  quality: 'full' | 'lite'
  onSelect: (slug: string) => void
  onError: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState<Photo | null>(null)
  const [active, setActive] = useState(true)
  const limit = quality === 'full' ? 20 : 12
  const visiblePhotos = useMemo(
    () => photos.filter((photo) => Boolean(textureUrl(photo.publicId, quality))).slice(0, limit),
    [limit, photos, quality]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && !document.hidden),
      { threshold: 0 }
    )
    observer.observe(root)
    const onVisibility = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <section ref={rootRef} className="world-gallery" aria-label={`${world.name} spatial gallery`}>
      <CanvasBoundary onError={onError}>
        <Canvas
          aria-hidden="true"
          frameloop={active ? 'always' : 'never'}
          shadows={quality === 'full' ? 'soft' : false}
          dpr={quality === 'full' ? [1, 1.75] : [1, 1.3]}
          camera={{ fov: 38, near: 0.1, far: 42, position: [0.25, 0.55, 11.4] }}
          gl={{
            antialias: true,
            alpha: false,
            stencil: false,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.08
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.shadowMap.type = THREE.PCFSoftShadowMap
          }}
          onPointerMissed={() => setFocused(null)}
        >
          <Suspense fallback={null}>
            <Scene
              photos={visiblePhotos}
              world={world}
              quality={quality}
              onSelect={onSelect}
              onFocus={setFocused}
            />
          </Suspense>
        </Canvas>
      </CanvasBoundary>

      <div className="world-gallery-chrome" aria-hidden="true">
        <span className="world-gallery-instruction mono-label">
          Hold + drag to orbit <i /> Scroll to move closer <i /> Select a frame
        </span>
        <span className="world-gallery-live">
          <i /> {String(visiblePhotos.length).padStart(2, '0')} memories in orbit
        </span>
      </div>

      <div className={`world-gallery-focus ${focused ? 'is-visible' : ''}`} aria-hidden="true">
        <span className="mono-label">{focused ? 'Selected memory' : world.name}</span>
        <strong className="display-font">{focused?.title ?? 'A world made of moments.'}</strong>
        <span>
          {focused?.caption ??
            focused?.alt ??
            'Move slowly. Every frame is anchored to this place.'}
        </span>
      </div>

      <nav className="sr-only" aria-label={`${world.name} photographs`}>
        <ul>
          {visiblePhotos.map((photo) => (
            <li key={photo.slug}>
              <Link to="/photos/$slug" params={{ slug: photo.slug }} viewTransition={false}>
                {photo.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
