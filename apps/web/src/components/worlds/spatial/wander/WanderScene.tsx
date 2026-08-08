import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import * as THREE from 'three'

import { getWorld } from '@/content/worlds'

import { HEADLAND, terrainHeight } from './terrain'
import { WanderWorld } from './WanderWorld'

import type { WanderProgress } from './types'

/**
 * POCKET WORLDS — FOLLOW THE LIGHT · Wander vertical slice.
 *
 * One continuous scroll-driven fly-through: a wide atmospheric establishing
 * view, an approach along the lagoon coast, a settled composition at the
 * headland portal (where the DOM panel invites entry), and a gentle pull
 * away toward the rest of the site. The camera path, the lit fraction of
 * the route, and the DOM all read from one scroll value.
 */

interface CameraKey {
  scroll: number
  position: [number, number, number]
  look: [number, number, number]
}

const DESKTOP_KEYS: CameraKey[] = [
  /* wide establishing view: island held in the upper right, air for the DOM copy lower left */
  { scroll: 0, position: [-9.6, 6.6, 13.2], look: [-3.1, -1.3, 1.5] },
  { scroll: 0.3, position: [-3.7, 2.8, 7.7], look: [0.3, 0.25, 0.6] },
  { scroll: 0.55, position: [0.2, 1.95, 5.9], look: [1.5, 0.5, 1.0] },
  { scroll: 0.76, position: [0.82, 1.38, 4.35], look: [2.25, 0.6, 1.58] },
  { scroll: 0.9, position: [0.86, 1.34, 4.28], look: [2.28, 0.58, 1.6] },
  { scroll: 1, position: [-0.9, 2.9, 6.4], look: [0.5, 0.45, 0.3] },
]

const MOBILE_KEYS: CameraKey[] = [
  { scroll: 0, position: [0.2, 8.4, 9.6], look: [-0.7, -1.0, 0.4] },
  { scroll: 0.3, position: [0.5, 4.6, 6.6], look: [0.3, 0.25, 0.4] },
  { scroll: 0.55, position: [0.85, 2.7, 5.3], look: [1.3, 0.5, 1.05] },
  { scroll: 0.76, position: [1.12, 1.78, 4.5], look: [2.25, 0.62, 1.58] },
  { scroll: 0.9, position: [1.16, 1.74, 4.44], look: [2.28, 0.6, 1.6] },
  { scroll: 1, position: [0.3, 3.6, 6.6], look: [0.5, 0.4, 0.4] },
]

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function sampleKeys(
  keys: CameraKey[],
  scroll: number,
  position: THREE.Vector3,
  look: THREE.Vector3
) {
  const p = THREE.MathUtils.clamp(scroll, 0, 1)

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p <= b.scroll) {
      const t = smoothstep(
        THREE.MathUtils.clamp((p - a.scroll) / Math.max(b.scroll - a.scroll, 1e-5), 0, 1)
      )
      position.set(
        THREE.MathUtils.lerp(a.position[0], b.position[0], t),
        THREE.MathUtils.lerp(a.position[1], b.position[1], t),
        THREE.MathUtils.lerp(a.position[2], b.position[2], t)
      )
      look.set(
        THREE.MathUtils.lerp(a.look[0], b.look[0], t),
        THREE.MathUtils.lerp(a.look[1], b.look[1], t),
        THREE.MathUtils.lerp(a.look[2], b.look[2], t)
      )
      return
    }
  }

  const last = keys[keys.length - 1]
  position.set(...last.position)
  look.set(...last.look)
}

/** How settled the visitor is at the world stop. */
function arrivalAt(scroll: number) {
  const rise = smoothstep(THREE.MathUtils.clamp((scroll - 0.66) / 0.12, 0, 1))
  const fall = 1 - smoothstep(THREE.MathUtils.clamp((scroll - 0.9) / 0.08, 0, 1))
  return Math.min(rise, fall)
}

function CameraRig({
  progress,
  quality,
  theme,
  onArrivedInPortal,
}: {
  progress: WanderProgress
  quality: 'full' | 'lite'
  theme: 'light' | 'dark'
  onArrivedInPortal: () => void
}) {
  const { camera, scene, pointer } = useThree()
  const lookRef = useRef(new THREE.Vector3(0, 0.4, 0))
  const posTarget = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const bgRef = useRef<THREE.Color | null>(null)
  const enteredRef = useRef(false)

  const portalAnchor = useMemo(() => {
    const y = terrainHeight(HEADLAND.x, HEADLAND.z)
    return new THREE.Vector3(HEADLAND.x, y + 0.46, HEADLAND.z)
  }, [])

  useFrame((_, delta) => {
    const keys = quality === 'full' ? DESKTOP_KEYS : MOBILE_KEYS
    const damp = 1 - Math.exp(-delta * 3.2)

    progress.camT += (progress.scroll - progress.camT) * damp
    progress.arrival = arrivalAt(progress.camT)
    progress.routeHead = THREE.MathUtils.clamp((progress.camT - 0.05) / 0.71, 0, 1)

    sampleKeys(keys, progress.camT, posTarget, lookTarget)

    /* restrained pointer parallax, desktop only */
    if (quality === 'full') {
      posTarget.x += pointer.x * 0.14
      posTarget.y += pointer.y * 0.09
    }

    /* entering the world: the camera glides into the portal */
    if (progress.flying) {
      progress.flyProgress = Math.min(progress.flyProgress + delta / 1.05, 1)
      const approach = camera.position.clone().sub(portalAnchor).normalize().multiplyScalar(0.4)
      posTarget.copy(portalAnchor.clone().add(approach))
      lookTarget.copy(portalAnchor)
      if (progress.flyProgress >= 1 && !enteredRef.current) {
        enteredRef.current = true
        onArrivedInPortal()
      }
    }

    const camDamp = 1 - Math.exp(-delta * (progress.flying ? 2.4 : 3.6))
    camera.position.lerp(posTarget, camDamp)
    lookRef.current.lerp(lookTarget, camDamp)
    camera.lookAt(lookRef.current)

    /* bright surreal atmosphere; dusk in dark theme */
    const base = theme === 'light' ? '#edeee4' : '#232830'
    bgRef.current ??= new THREE.Color(base)
    const target = new THREE.Color(base)
    if (progress.flying) {
      target.set(theme === 'light' ? '#e3edf1' : '#16303c')
    }
    bgRef.current.lerp(target, damp)
    scene.background = bgRef.current
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(bgRef.current)
    } else {
      scene.fog = new THREE.Fog(bgRef.current.clone(), 10, 32)
    }
  })

  return null
}

function SceneLights({ quality }: { quality: 'full' | 'lite' }) {
  return (
    <>
      <hemisphereLight args={['#fdf9ee', '#c4b699', 0.6]} />
      <ambientLight intensity={0.14} />
      <directionalLight
        position={[6, 8.5, 4.5]}
        intensity={1.75}
        color="#fff1d6"
        castShadow={quality === 'full'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={2}
        shadow-camera-far={24}
        shadow-bias={-0.0004}
      />
    </>
  )
}

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

export default function WanderScene({
  containerRef,
  quality,
  onEnterWorld,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  quality: 'full' | 'lite'
  onEnterWorld: () => void
  /** DOM identity block over the opening view */
  children?: ReactNode
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const progress = useRef<WanderProgress>({
    scroll: 0,
    camT: 0,
    routeHead: 0,
    arrival: 0,
    portalHovered: false,
    flyProgress: 0,
    flying: false,
  }).current

  const [hovered, setHovered] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [ending, setEnding] = useState(false)
  const [flying, setFlying] = useState(false)
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const world = getWorld('wander')!

  const headlineOpacity = useMotionValue(1)

  const syncFromScroll = useCallback(
    (value: number) => {
      progress.scroll = value
      headlineOpacity.set(1 - THREE.MathUtils.clamp((value - 0.01) / 0.09, 0, 1))
      setArrived(arrivalAt(value) > 0.45)
      setEnding(value > 0.955)
    },
    [progress, headlineOpacity]
  )

  /* Journey progress measured directly from the container's live rect —
     immune to remounts, scroll restoration, and the SSR→spatial tier swap. */
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const measure = () => {
      const rect = container.getBoundingClientRect()
      const scrollable = Math.max(rect.height - window.innerHeight, 1)
      return THREE.MathUtils.clamp(-rect.top / scrollable, 0, 1)
    }

    /* back-navigation restores mid-journey scroll: land there, don't replay */
    const initial = measure()
    if (initial > 0) {
      progress.camT = initial
    }
    syncFromScroll(initial)

    const handleScroll = () => syncFromScroll(measure())
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [containerRef, progress, syncFromScroll])

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
      { threshold: 0 }
    )
    intersection.observe(container)
    const handleVisibility = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      intersection.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [containerRef])

  const handlePortalHover = useCallback(
    (value: boolean) => {
      progress.portalHovered = value
      setHovered(value)
    },
    [progress]
  )

  const handleEnter = useCallback(() => {
    if (progress.flying) {
      return
    }
    progress.flying = true
    progress.flyProgress = 0
    setFlying(true)
  }, [progress])

  return (
    <div
      ref={viewportRef}
      className={quality === 'full' ? 'absolute inset-0 cursor-none' : 'absolute inset-0'}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 700ms ease' }}
    >
      <CanvasErrorBoundary>
        <Canvas
          aria-hidden="true"
          frameloop={active ? 'always' : 'never'}
          shadows={quality === 'full'}
          dpr={quality === 'full' ? [1, 1.75] : [1, 1.5]}
          camera={{ fov: quality === 'full' ? 40 : 46, position: [-7.8, 5.4, 9.8] }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={() => setReady(true)}
        >
          <Suspense fallback={null}>
            <SceneLights quality={quality} />
            <CameraRig
              progress={progress}
              quality={quality}
              theme={theme}
              onArrivedInPortal={onEnterWorld}
            />
            <WanderWorld
              progress={progress}
              quality={quality}
              onPortalHover={handlePortalHover}
              onPortalSelect={handleEnter}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {quality === 'full' ? <FocusReticle containerRef={viewportRef} engaged={hovered} /> : null}

      {/* Identity block over the opening view */}
      <motion.div
        className="absolute inset-x-0 bottom-14 z-10"
        style={{ opacity: headlineOpacity, pointerEvents: arrived || ending ? 'none' : undefined }}
      >
        {children}
      </motion.div>

      {/* World placard at the stop — the accessible entry */}
      <div className="pointer-events-none absolute inset-x-4 bottom-6 z-10 sm:inset-x-auto sm:left-8 sm:bottom-14 sm:w-85">
        <AnimatePresence>
          {arrived && !ending ? (
            <motion.div
              key="wander-panel"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto rounded-2xl bg-[color-mix(in_srgb,var(--bg)_62%,transparent)] p-5 backdrop-blur-md"
              style={{ '--world-accent': world.mood.accent } as React.CSSProperties}
            >
              <p className="mono-label m-0">01 / 05 · world</p>
              <p className="display-font m-0 mt-1 text-3xl font-light text-(--ink) sm:text-4xl">
                {world.name}
              </p>
              <p className="display-italic m-0 mt-1 text-base text-(--muted-strong)">
                {world.line}
              </p>
              <Link
                to="/worlds/$world"
                params={{ world: 'wander' }}
                onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                    return
                  }
                  event.preventDefault()
                  handleEnter()
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-(--ink) px-5 py-3 text-sm font-semibold text-(--bg) no-underline hover:-translate-y-0.5"
              >
                {flying ? 'Entering…' : 'Enter this world'}
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* End of the slice: hand the visitor onward */}
      <AnimatePresence>
        {ending && !flying ? (
          <motion.div
            key="ending"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-16 z-10 flex justify-center"
          >
            <div className="pointer-events-auto rounded-2xl bg-[color-mix(in_srgb,var(--bg)_62%,transparent)] px-6 py-4 text-center backdrop-blur-md">
              <p className="mono-label m-0">The light continues — four more worlds below</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#worlds"
                  className="rounded-full bg-(--ink) px-5 py-3 text-sm font-semibold text-(--bg) no-underline"
                >
                  Keep going ↓
                </a>
                <Link
                  to="/archive"
                  className="px-2 py-2 text-sm font-semibold text-(--muted-strong)"
                >
                  Open the Index
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
