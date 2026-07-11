import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'

import { getManifestEntry, getPublicWorlds, getWorld, type WorldSlug } from '@/content/worlds'
import { getLocalVariantUrl } from '@/lib/local-photos'

/**
 * The spatial opening: a WebGL constellation layered under the DOM headline.
 *
 * Choreography (one continuous timeline, ~4s, never blocking the DOM):
 *   1. Six torn fragments of “Leaf, After Rain” hang scattered in depth.
 *   2. They align into the complete photograph, which separates into subtle
 *      depth layers that answer the pointer.
 *   3. The camera pulls back; the assembled leaf travels into its place as
 *      the Small Wonders entrance while the other four world photographs
 *      arrive from depth — the constellation of Pocket Worlds.
 *   4. Focusing a world tints the whole environment with that world's
 *      measured mood; entering one flies the camera into its photograph
 *      before the route changes.
 *
 * The intro plays once per session; returning to `/` resumes directly in the
 * constellation. The canvas is aria-hidden — keyboard and screen-reader
 * world selection lives in the DOM grid below the fold.
 */

const INTRO = {
  assembleStart: 0.35,
  assembleDuration: 1.5,
  pullbackStart: 2.5,
  pullbackDuration: 1.7,
}
const INTERACTIVE_AT = INTRO.pullbackStart + INTRO.pullbackDuration

const CAMERA_NEAR_Z = 3.4
const CAMERA_FAR_Z = 5.6

const LEAF_ID = 'leaf-after-rain'
const LEAF_HEIGHT = 2.4

/** Torn-print tiles of the leaf photograph: x/y/w/h in UV space (bottom origin). */
const LEAF_TILES = [
  { uv: [0, 0.62, 0.55, 0.38], scatter: [-1.6, 0.9, 0.5, -0.12], settleZ: -0.06 },
  { uv: [0.55, 0.62, 0.45, 0.38], scatter: [1.4, 1.1, -0.6, 0.1], settleZ: -0.1 },
  { uv: [0, 0.3, 0.48, 0.32], scatter: [-1.9, -0.2, -0.9, 0.08], settleZ: 0.04 },
  { uv: [0.48, 0.3, 0.52, 0.32], scatter: [1.8, 0.15, 0.7, -0.09], settleZ: 0.12 },
  { uv: [0, 0, 0.52, 0.3], scatter: [-1.2, -1.1, 0.9, 0.14], settleZ: 0.02 },
  { uv: [0.52, 0, 0.48, 0.3], scatter: [1.5, -0.9, -0.4, -0.07], settleZ: -0.04 },
] as const

/**
 * Constellation composition. Lower-left is deliberate negative space for the
 * DOM headline; the sea horizon runs low across center, towers rise on the
 * right, the parakeet waits deepest in the upper shade.
 */
interface PortalDef {
  slug: WorldSlug
  photoId: string
  position: [number, number, number]
  width: number
  /** Living Things sits in shade — slightly dimmed at rest */
  restOpacity?: number
}

const PORTALS: PortalDef[] = [
  { slug: 'wander', photoId: 'the-sea', position: [0.55, -1.18, 0.2], width: 2.2 },
  { slug: 'sacred-geometry', photoId: 'tower-and-sky', position: [1.95, 0.5, -0.2], width: 1.47 },
  {
    slug: 'living-things',
    photoId: 'parakeet',
    position: [-1.55, 1.05, -1.0],
    width: 1.2,
    restOpacity: 0.88,
  },
  { slug: 'at-the-table', photoId: 'banana-leaf-meal', position: [2.0, -1.05, -0.55], width: 1.8 },
]

const LEAF_PORTAL = {
  slug: 'small-wonders' as WorldSlug,
  position: [0.3, 0.35, 0.6] as const,
  scale: 0.625,
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4)

function phaseProgress(elapsed: number, start: number, duration: number) {
  return easeOut((elapsed - start) / duration)
}

/** Intro plays once per session; back-navigation resumes in the constellation. */
let introPlayed = false

function aspectOf(photoId: string) {
  const entry = getManifestEntry(photoId)
  return entry ? entry.width / entry.height : 1
}

function textureUrl(photoId: string) {
  return getLocalVariantUrl(`local/${photoId}`, 768) ?? ''
}

interface SceneProps {
  theme: 'light' | 'dark'
  focused: WorldSlug | null
  flying: WorldSlug | null
  onFocus: (slug: WorldSlug | null) => void
  onSelect: (slug: WorldSlug) => void
  onReady: () => void
}

function tileGeometry(imageWidth: number, tile: (typeof LEAF_TILES)[number]) {
  const [tx, ty, tw, th] = tile.uv
  const geometry = new THREE.PlaneGeometry(imageWidth * tw, LEAF_HEIGHT * th)
  const uv = geometry.attributes.uv as THREE.BufferAttribute
  uv.setXY(0, tx, ty + th)
  uv.setXY(1, tx + tw, ty + th)
  uv.setXY(2, tx, ty)
  uv.setXY(3, tx + tw, ty)
  uv.needsUpdate = true
  return geometry
}

function Portal({
  def,
  texture,
  matteColor,
  focused,
  flying,
  onFocus,
  onSelect,
  arrival,
}: {
  def: PortalDef
  texture: THREE.Texture
  matteColor: string
  focused: WorldSlug | null
  flying: WorldSlug | null
  onFocus: (slug: WorldSlug | null) => void
  onSelect: (slug: WorldSlug) => void
  /** 0 → hidden in depth, 1 → in place */
  arrival: React.MutableRefObject<number>
}) {
  const group = useRef<THREE.Group>(null)
  const photoMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const matteMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const height = def.width / aspectOf(def.photoId)
  const isFocused = focused === def.slug
  const isFlying = flying === def.slug
  const otherFlying = flying !== null && !isFlying

  useFrame((_, delta) => {
    if (!group.current || !photoMaterial.current || !matteMaterial.current) {
      return
    }

    const a = arrival.current
    const damp = 1 - Math.exp(-delta * 6)

    const targetZ = def.position[2] - (1 - a) * 2.6 + (isFocused ? 0.18 : 0) + (isFlying ? 0.4 : 0)
    group.current.position.x = def.position[0]
    group.current.position.y = def.position[1]
    group.current.position.z += (targetZ - group.current.position.z) * damp

    const targetScale = (isFocused ? 1.05 : 1) * (isFlying ? 1.1 : 1)
    const scale = group.current.scale.x + (targetScale - group.current.scale.x) * damp
    group.current.scale.setScalar(scale)

    const rest = def.restOpacity ?? 1
    const dimmed = focused !== null && !isFocused ? 0.55 : rest
    const targetOpacity = otherFlying ? 0 : a * (isFlying ? 1 : dimmed)
    photoMaterial.current.opacity += (targetOpacity - photoMaterial.current.opacity) * damp
    matteMaterial.current.opacity = photoMaterial.current.opacity * 0.9
  })

  return (
    <group ref={group} position={[def.position[0], def.position[1], def.position[2] - 2.6]}>
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[def.width * 1.06, height * 1.06]} />
        <meshBasicMaterial ref={matteMaterial} color={matteColor} transparent opacity={0} />
      </mesh>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation()
          onFocus(def.slug)
        }}
        onPointerOut={() => onFocus(null)}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(def.slug)
        }}
      >
        <planeGeometry args={[def.width, height]} />
        <meshBasicMaterial
          ref={photoMaterial}
          map={texture}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function OpeningScene({ theme, focused, flying, onFocus, onSelect, onReady }: SceneProps) {
  const { camera, scene, pointer } = useThree()
  const leafGroup = useRef<THREE.Group>(null)
  const tileRefs = useRef<Array<THREE.Group | null>>([])
  const startOffset = useRef(introPlayed ? INTERACTIVE_AT : 0)
  const elapsedRef = useRef(startOffset.current)
  const arrival = useRef(introPlayed ? 1 : 0)
  const flyStart = useRef<number | null>(null)
  const bgColor = useRef(new THREE.Color())
  const leafAspect = aspectOf(LEAF_ID)
  const leafWidth = LEAF_HEIGHT * leafAspect

  const urls = useMemo(
    () => [textureUrl(LEAF_ID), ...PORTALS.map((portal) => textureUrl(portal.photoId))],
    []
  )
  const textures = useLoader(THREE.TextureLoader, urls)
  const [leafTexture, ...portalTextures] = textures

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
    })
    onReady()
  }, [textures, onReady])

  const tileGeometries = useMemo(
    () => LEAF_TILES.map((tile) => tileGeometry(leafWidth, tile)),
    [leafWidth]
  )

  useEffect(
    () => () => {
      tileGeometries.forEach((geometry) => geometry.dispose())
    },
    [tileGeometries]
  )

  const palette = useMemo(() => {
    const base = theme === 'light' ? '#f8f5ee' : '#14120e'
    const matte = theme === 'light' ? '#fffdf7' : '#2b261f'
    return { base, matte }
  }, [theme])

  useFrame((state, delta) => {
    elapsedRef.current = state.clock.getElapsedTime() + startOffset.current
    const elapsed = elapsedRef.current
    const damp = 1 - Math.exp(-delta * 5)

    const assemble = phaseProgress(elapsed, INTRO.assembleStart, INTRO.assembleDuration)
    const pullback = phaseProgress(elapsed, INTRO.pullbackStart, INTRO.pullbackDuration)
    arrival.current = pullback

    if (elapsed >= INTERACTIVE_AT && !introPlayed) {
      introPlayed = true
    }

    /* Leaf fragments: scatter → aligned, with per-tile depth separation */
    LEAF_TILES.forEach((tile, index) => {
      const tileGroup = tileRefs.current[index]
      if (!tileGroup) {
        return
      }

      const [tx, ty, tw, th] = tile.uv
      const alignedX = (tx + tw / 2 - 0.5) * leafWidth
      const alignedY = (ty + th / 2 - 0.5) * LEAF_HEIGHT
      const [sx, sy, sz, rot] = tile.scatter

      tileGroup.position.x = THREE.MathUtils.lerp(alignedX + sx, alignedX, assemble)
      tileGroup.position.y = THREE.MathUtils.lerp(alignedY + sy, alignedY, assemble)
      tileGroup.position.z =
        THREE.MathUtils.lerp(sz, tile.settleZ * (1 - pullback * 0.7), assemble) +
        tile.settleZ * pointer.x * 0.12 * (1 - pullback)
      tileGroup.rotation.z = THREE.MathUtils.lerp(rot, 0, assemble)
    })

    /* Assembled leaf travels into its constellation slot */
    if (leafGroup.current) {
      const baseScale = THREE.MathUtils.lerp(1, LEAF_PORTAL.scale, pullback)
      const focusBoost = focused === 'small-wonders' ? 1.05 : 1
      const targetScale = baseScale * focusBoost * (flying === 'small-wonders' ? 1.1 : 1)
      const nextScale = leafGroup.current.scale.x + (targetScale - leafGroup.current.scale.x) * damp
      leafGroup.current.scale.setScalar(pullback < 0.02 ? baseScale : nextScale)
      leafGroup.current.position.x = THREE.MathUtils.lerp(0, LEAF_PORTAL.position[0], pullback)
      leafGroup.current.position.y = THREE.MathUtils.lerp(0.15, LEAF_PORTAL.position[1], pullback)
      leafGroup.current.position.z =
        THREE.MathUtils.lerp(0, LEAF_PORTAL.position[2], pullback) +
        (focused === 'small-wonders' ? 0.18 : 0)
      const leafDim =
        flying !== null && flying !== 'small-wonders'
          ? 0
          : focused !== null && focused !== 'small-wonders'
            ? 0.55
            : 1
      leafGroup.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshBasicMaterial
          material.opacity += (leafDim - material.opacity) * damp
        }
      })
    }

    /* Environment: background + fog adopt the focused world's measured mood */
    const focusWorld = focused ? getWorld(focused) : null
    const target = new THREE.Color(palette.base)
    if (focusWorld) {
      const mood = new THREE.Color(theme === 'light' ? focusWorld.mood.wash : focusWorld.mood.deep)
      target.lerp(mood, theme === 'light' ? 0.85 : 0.5)
    }
    bgColor.current.lerp(target, damp * 0.9)
    scene.background = bgColor.current
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(bgColor.current)
    } else {
      scene.fog = new THREE.Fog(bgColor.current.clone(), 6.5, 10.5)
    }

    /* Camera: pullback + pointer parallax + drift toward the focused world */
    const focusDef = focused
      ? focused === 'small-wonders'
        ? { position: LEAF_PORTAL.position }
        : PORTALS.find((portal) => portal.slug === focused)
      : null

    let targetX = pointer.x * 0.32 + (focusDef ? focusDef.position[0] * 0.14 : 0)
    let targetY = pointer.y * 0.22 + (focusDef ? focusDef.position[1] * 0.14 : 0)
    let targetZ = THREE.MathUtils.lerp(CAMERA_NEAR_Z, CAMERA_FAR_Z, pullback)

    if (flying) {
      const dest =
        flying === 'small-wonders'
          ? LEAF_PORTAL.position
          : PORTALS.find((portal) => portal.slug === flying)!.position
      targetX = dest[0]
      targetY = dest[1]
      targetZ = dest[2] + 1.18
      if (flyStart.current === null) {
        flyStart.current = elapsed
      }
    }

    const camDamp = 1 - Math.exp(-delta * (flying ? 3.4 : 4.5))
    camera.position.x += (targetX - camera.position.x) * camDamp
    camera.position.y += (targetY - camera.position.y) * camDamp
    camera.position.z += (targetZ - camera.position.z) * camDamp
    camera.lookAt(0, 0, -0.4)
  })

  return (
    <>
      <group ref={leafGroup} position={[0, 0.15, 0]}>
        {LEAF_TILES.map((tile, index) => (
          <group
            key={tile.uv.join(':')}
            ref={(node) => {
              tileRefs.current[index] = node
            }}
          >
            <mesh
              geometry={tileGeometries[index]}
              onPointerOver={(event) => {
                if (arrival.current > 0.95) {
                  event.stopPropagation()
                  onFocus('small-wonders')
                }
              }}
              onPointerOut={() => onFocus(null)}
              onClick={(event) => {
                if (arrival.current > 0.95) {
                  event.stopPropagation()
                  onSelect('small-wonders')
                }
              }}
            >
              <meshBasicMaterial map={leafTexture} transparent opacity={1} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {PORTALS.map((portal, index) => (
        <Portal
          key={portal.slug}
          def={portal}
          texture={portalTextures[index]}
          matteColor={palette.matte}
          focused={focused}
          flying={flying}
          onFocus={onFocus}
          onSelect={onSelect}
          arrival={arrival}
        />
      ))}
    </>
  )
}

/** Focus-reticle cursor, scoped to the canvas area on fine pointers only. */
function FocusReticle({
  containerRef,
  engaged,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  engaged: boolean
}) {
  const reticleRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleMove = (event: PointerEvent) => {
      const reticle = reticleRef.current
      if (!reticle) {
        return
      }
      const rect = container.getBoundingClientRect()
      reticle.style.transform = `translate(${event.clientX - rect.left}px, ${event.clientY - rect.top}px)`
      setVisible(true)
    }
    const handleLeave = () => setVisible(false)

    container.addEventListener('pointermove', handleMove, { passive: true })
    container.addEventListener('pointerleave', handleLeave)
    return () => {
      container.removeEventListener('pointermove', handleMove)
      container.removeEventListener('pointerleave', handleLeave)
    }
  }, [containerRef])

  return (
    <div
      ref={reticleRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-20"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className="relative -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200"
        style={{
          width: engaged ? 44 : 26,
          height: engaged ? 44 : 26,
          borderColor: engaged
            ? 'color-mix(in srgb, var(--world-accent) 80%, var(--ink))'
            : 'color-mix(in srgb, var(--ink) 45%, transparent)',
        }}
      >
        <span
          className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--ink) 60%, transparent)' }}
        />
      </div>
    </div>
  )
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function SpatialOpening({
  onEnterWorld,
  onFlightChange,
}: {
  onEnterWorld: (slug: WorldSlug) => void
  onFlightChange?: (flying: boolean) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState<WorldSlug | null>(null)
  const [flying, setFlying] = useState<WorldSlug | null>(null)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const readTheme = () => setTheme(root.classList.contains('dark') ? 'dark' : 'light')
    readTheme()
    const observer = new MutationObserver(readTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const intersection = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && !document.hidden),
      { threshold: 0.05 }
    )
    intersection.observe(container)
    const handleVisibility = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      intersection.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    onFlightChange?.(flying !== null)

    if (!flying) {
      return
    }

    const timer = window.setTimeout(() => onEnterWorld(flying), 780)
    return () => window.clearTimeout(timer)
  }, [flying, onEnterWorld, onFlightChange])

  const focusedWorld = focused ? getWorld(focused) : null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 [cursor:none]"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms ease' }}
    >
      <CanvasErrorBoundary>
        <Canvas
          aria-hidden="true"
          frameloop={active ? 'always' : 'never'}
          dpr={[1, 1.75]}
          camera={{ fov: 38, position: [0, 0, introPlayed ? CAMERA_FAR_Z : CAMERA_NEAR_Z] }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <OpeningScene
              theme={theme}
              focused={flying ?? focused}
              flying={flying}
              onFocus={(slug) => {
                if (!flying) {
                  setFocused(slug)
                }
              }}
              onSelect={(slug) => {
                if (!flying) {
                  setFlying(slug)
                }
              }}
              onReady={() => setReady(true)}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      <FocusReticle containerRef={containerRef} engaged={focused !== null} />

      {/* World placard: the DOM voice of the canvas */}
      <div className="pointer-events-none absolute right-8 bottom-16 z-10 hidden min-h-[92px] w-72 rounded-2xl bg-[color-mix(in_srgb,var(--bg)_58%,transparent)] p-4 text-right backdrop-blur-md lg:block">
        <AnimatePresence mode="wait">
          {focusedWorld ? (
            <motion.div
              key={focusedWorld.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              <p className="mono-label m-0">
                {String(
                  getPublicWorlds().findIndex((world) => world.slug === focusedWorld.slug) + 1
                ).padStart(2, '0')}{' '}
                / 05
              </p>
              <p className="display-font m-0 mt-1 text-3xl font-light text-[var(--ink)]">
                {focusedWorld.name}
              </p>
              <p className="display-italic m-0 mt-1 text-sm text-[var(--muted-strong)]">
                {focusedWorld.line}
              </p>
              <p className="mono-label m-0 mt-2">{flying ? 'entering…' : 'click to enter'}</p>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              className="mono-label m-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, delay: 0.4 }}
            >
              five worlds are hanging here · move toward one
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
