import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { Link } from '@tanstack/react-router'

import { useHydratedReducedMotion } from '@/lib/motion'

import { ORBIT_TILT, orbitPlacement, orbitRadius, type OrbitPlacement } from './orrery-math'
import { PlanetStill } from './planet/PlanetStill'

import type { WorldOverview } from '@/lib/world-overview'
import type { HomePageContent } from '@/types/content'

/**
 * The opening plate: every world as a pocket planet, drawn as an orrery.
 *
 * Each world has its own orbit around a small sun of captured light. Orbits
 * are ellipses (a tilted ring seen from above), planets on the near side sit
 * larger and in front, and outer orbits turn more slowly — so the system
 * reads as one quiet, physical object. Planets can be spun by dragging; a
 * click (not a drag) takes you down to that world's chapter.
 *
 * Positions are a pure function of time, so the server renders the exact
 * first frame and the client simply carries on from it.
 */

function placementStyle(placement: OrbitPlacement): CSSProperties {
  return {
    left: `${placement.x}%`,
    top: `${placement.y}%`,
    zIndex: Math.round(placement.depth * 10) + (placement.depth > 0.5 ? 10 : 0),
    '--depth': placement.depth.toFixed(3),
  } as CSSProperties
}

export function HomeOrrery({
  page,
  overviews,
  totalFrames,
}: {
  page: Pick<HomePageContent, 'eyebrow' | 'headline' | 'intro'>
  overviews: WorldOverview[]
  totalFrames: number
}) {
  const reducedMotion = useHydratedReducedMotion()
  const systemRef = useRef<HTMLDivElement>(null)
  const planetRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const count = overviews.length

  /* revolve: one rAF loop for every planet, paused off-screen and while hovered */
  useEffect(() => {
    const system = systemRef.current
    if (!system || reducedMotion || count === 0) {
      return
    }

    let frame = 0
    let visible = true
    let last = performance.now()
    let clock = 0
    let held = false

    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!held) {
        clock += delta
      }
      planetRefs.current.forEach((element, index) => {
        if (!element) {
          return
        }
        const placement = orbitPlacement(index, count, clock)
        element.style.left = `${placement.x}%`
        element.style.top = `${placement.y}%`
        element.style.zIndex = String(
          Math.round(placement.depth * 10) + (placement.depth > 0.5 ? 10 : 0)
        )
        element.style.setProperty('--depth', placement.depth.toFixed(3))
      })
      frame = visible && document.visibilityState === 'visible' ? requestAnimationFrame(tick) : 0
    }

    const resume = () => {
      if (!frame && visible && document.visibilityState === 'visible') {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      resume()
    })
    observer.observe(system)

    const hold = () => {
      held = true
    }
    const release = () => {
      held = false
    }
    system.addEventListener('pointerenter', hold)
    system.addEventListener('pointerleave', release)
    system.addEventListener('focusin', hold)
    system.addEventListener('focusout', release)
    document.addEventListener('visibilitychange', resume)
    resume()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      system.removeEventListener('pointerenter', hold)
      system.removeEventListener('pointerleave', release)
      system.removeEventListener('focusin', hold)
      system.removeEventListener('focusout', release)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [count, reducedMotion])

  return (
    <section className="orrery" aria-labelledby="orrery-title">
      <div className="orrery__copy page-shell">
        <div className="orrery__copy-inner">
          <p className="mono-label orrery__eyebrow">
            FrameOS <span aria-hidden="true">·</span> {page.eyebrow}
          </p>
          <h1 id="orrery-title" className="display-font orrery__title">
            {page.headline}
          </h1>
          <p className="orrery__intro">{page.intro}</p>
          <div className="orrery__actions">
            {overviews[0] ? (
              <a
                href={`#world-${overviews[0].world.slug}`}
                className="home-action home-action--solid"
              >
                Unfold the worlds <span aria-hidden="true">↓</span>
              </a>
            ) : null}
            <Link to="/archive" className="home-action home-action--line">
              Open the Index
            </Link>
          </div>
        </div>
        <p className="mono-label orrery__legend">
          <span>
            Fig. 1 — {count} {count === 1 ? 'world' : 'worlds'}, {totalFrames} frames.
          </span>
          <span>Each planet is one photograph, curled. Drag one to turn it.</span>
        </p>
      </div>
      <div className="orrery__system" ref={systemRef}>
        <svg
          className="orrery__orbits"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {overviews.map((overview, index) => {
            const rx = orbitRadius(index, count) / 2
            return (
              <ellipse
                key={overview.world.slug}
                cx="50"
                cy="50"
                rx={rx}
                ry={rx * ORBIT_TILT * 2}
                className="orrery__orbit"
                style={{ '--orbit-accent': overview.world.mood.accent } as CSSProperties}
                data-world={overview.world.slug}
              />
            )
          })}
        </svg>
        <span className="orrery__sun" aria-hidden="true" />

        <ol className="orrery__planets" aria-label="Worlds">
          {overviews.map((overview, index) => (
            <li key={overview.world.slug} className="contents">
              <OrreryPlanet
                overview={overview}
                index={index}
                placement={orbitPlacement(index, count, 0)}
                ref={(element) => {
                  planetRefs.current[index] = element
                }}
                reducedMotion={reducedMotion}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function OrreryPlanet({
  overview,
  index,
  placement,
  ref,
  reducedMotion,
}: {
  overview: WorldOverview
  index: number
  placement: OrbitPlacement
  ref: (element: HTMLAnchorElement | null) => void
  reducedMotion: boolean
}) {
  const { world, planet, photoCount } = overview
  const turnRef = useRef<HTMLSpanElement>(null)
  const drag = useRef<{
    pointerId: number
    lastAngle: number
    moved: number
    angle: number
    velocity: number
    lastTime: number
  } | null>(null)
  const angleRef = useRef(0)
  const suppressClick = useRef(false)
  const inertia = useRef(0)

  const centreAngle = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.atan2(
      event.clientY - (rect.top + rect.height / 2),
      event.clientX - (rect.left + rect.width / 2)
    )
  }

  const applyAngle = () => {
    turnRef.current?.style.setProperty('--turn', `${angleRef.current}rad`)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || reducedMotion) {
      return
    }
    cancelAnimationFrame(inertia.current)
    drag.current = {
      pointerId: event.pointerId,
      lastAngle: centreAngle(event),
      moved: 0,
      angle: angleRef.current,
      velocity: 0,
      lastTime: performance.now(),
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    const next = centreAngle(event)
    let delta = next - state.lastAngle
    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2
    state.lastAngle = next
    state.moved += Math.abs(delta)
    if (state.moved > 0.08 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const now = performance.now()
    state.velocity = delta / Math.max(1, now - state.lastTime)
    state.lastTime = now
    angleRef.current += delta
    applyAngle()
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const state = drag.current
    drag.current = null
    if (!state || state.pointerId !== event.pointerId) {
      return
    }
    suppressClick.current = state.moved > 0.08
    /* let it coast to a stop */
    let velocity = state.velocity
    let last = performance.now()
    const coast = (now: number) => {
      const dt = now - last
      last = now
      velocity *= Math.pow(0.996, dt)
      angleRef.current += velocity * dt
      applyAngle()
      if (Math.abs(velocity) > 0.00002) {
        inertia.current = requestAnimationFrame(coast)
      }
    }
    inertia.current = requestAnimationFrame(coast)
  }

  useEffect(() => () => cancelAnimationFrame(inertia.current), [])

  const style = {
    ...placementStyle(placement),
    '--planet-scale': (0.86 + Math.min(photoCount, 12) * 0.025).toFixed(3),
    '--spin-duration': `${110 + index * 23}s`,
    '--spin-direction': index % 2 === 0 ? 'normal' : 'reverse',
    '--world-accent': world.mood.accent,
    '--world-wash': world.mood.wash,
  } as CSSProperties

  return (
    <a
      ref={ref}
      href={`#world-${world.slug}`}
      className="orrery__planet"
      style={style}
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(event) => {
        if (suppressClick.current) {
          event.preventDefault()
          suppressClick.current = false
        }
      }}
      aria-label={`${world.name}: ${world.line} ${photoCount} ${photoCount === 1 ? 'frame' : 'frames'}.`}
    >
      <span className="orrery__planet-turn" ref={turnRef}>
        <PlanetStill
          photo={planet.photo}
          horizon={planet.horizon}
          glow={world.mood.wash}
          cssSize={200}
          eager
          className="orrery__planet-body"
        />
      </span>
      <span className="orrery__label" aria-hidden="true">
        <span className="orrery__label-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="orrery__label-name">{world.name}</span>
        <span className="orrery__label-count">{String(photoCount).padStart(2, '0')}</span>
      </span>
    </a>
  )
}
