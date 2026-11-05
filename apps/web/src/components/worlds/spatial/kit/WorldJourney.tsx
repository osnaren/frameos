import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import * as THREE from 'three'

import { getLocalPhotoAsset } from '@/lib/local-photos'
import { useHydratedReducedMotion } from '@/lib/motion'

import { arrivalAt } from './camera'
import { FLIGHT_SECONDS } from './light'
import { buildWorldPalette } from './palette'
import { WorldScene } from './WorldScene'

import type { Quality, WorldForm, WorldProgress } from './types'
import type { WorldDefinition } from '@/content/worlds'

/**
 * One world's journey: the scroll container, the DOM written around the
 * scene, and the transition that hands the visitor into the collection.
 *
 * The scene is decoration — every word, link and control here is real DOM, so
 * the section is navigable and readable with the canvas switched off. Nothing
 * in this file is specific to a world; it takes the CMS document and the
 * form, and the form decides what gets built.
 */

/** How much scroll one world occupies. Long enough to feel like travel. */
const JOURNEY_HEIGHT_VH = 420

type Phase = 'opening' | 'travelling' | 'arrived' | 'onward'

export function WorldJourney({
  world,
  form,
  quality,
  index,
  total,
  /** Anchor the "keep going" control jumps to. */
  onwardHref,
  isFirst,
  onReady,
  onFailed,
}: {
  world: WorldDefinition
  form: WorldForm
  quality: Quality
  index: number
  total: number
  onwardHref: string
  isFirst: boolean
  onReady: () => void
  onFailed: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const reducedMotion = useHydratedReducedMotion()

  const progress = useRef<WorldProgress>({
    scroll: 0,
    camT: 0,
    routeHead: 0,
    arrival: 0,
    destinationHovered: false,
    focusDistance: 30,
    flyProgress: 0,
    flying: false,
  }).current

  const [phase, setPhase] = useState<Phase>('opening')
  const [hovered, setHovered] = useState(false)
  const [entering, setEntering] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [active, setActive] = useState(isFirst)
  /* the first world is resident from the start, so the page opens on a scene */
  const [mounted, setMounted] = useState(isFirst)
  const [dusk, setDusk] = useState(0)

  /* Colour comes from the CMS. Changing how a world feels is an edit. */
  const palette = useMemo(() => buildWorldPalette(world.mood, form.tones), [world.mood, form.tones])
  const heroPhoto = useMemo(() => getLocalPhotoAsset(world.heroId), [world.heroId])

  /* ---- scroll → journey progress, measured from the container's live rect ---- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let frame = 0

    const measure = () => {
      const rect = container.getBoundingClientRect()
      const scrollable = Math.max(rect.height - window.innerHeight, 1)
      return THREE.MathUtils.clamp(-rect.top / scrollable, 0, 1)
    }

    const apply = (value: number) => {
      progress.scroll = value
      setPhase(
        value < 0.08
          ? 'opening'
          : value > 0.955
            ? 'onward'
            : arrivalAt(value) > 0.45
              ? 'arrived'
              : 'travelling'
      )
    }

    /* a restored mid-journey scroll should land, not replay */
    const initial = measure()
    progress.camT = initial
    apply(initial)

    const onScroll = () => {
      if (frame) {
        return
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0
        apply(measure())
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('orientationchange', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('orientationchange', onScroll)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [progress])

  /* ---- pull the stage up under the sticky header on the first world ---- */
  useEffect(() => {
    const container = containerRef.current
    const header = document.querySelector<HTMLElement>('.site-header')
    if (!container || !header || !isFirst) {
      return
    }

    const apply = () => container.style.setProperty('--journey-header', `${header.offsetHeight}px`)

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(header)
    return () => observer.disconnect()
  }, [isFirst])

  /* ---- what keeps a set of worlds affordable ----
     Two thresholds, not one. A world *renders* only while it is actually on
     screen and the tab is visible. It stays *mounted* over a much wider band,
     because building a world costs a couple of hundred milliseconds of
     terrain generation and nobody should pay that again for scrolling back
     up one section. Outside that band the canvas is unmounted entirely, which
     releases its WebGL context — a browser only grants a handful, and five
     live contexts is a real cost on a phone even when four are idle. */
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let onScreen = isFirst
    const sync = () => setActive(onScreen && !document.hidden)

    const rendering = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 }
    )
    const resident = new IntersectionObserver(([entry]) => setMounted(entry.isIntersecting), {
      rootMargin: '120% 0px',
    })

    rendering.observe(container)
    resident.observe(container)
    document.addEventListener('visibilitychange', sync)

    return () => {
      rendering.disconnect()
      resident.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [isFirst])

  /* ---- the scene follows the site's theme ---- */
  useEffect(() => {
    const root = document.documentElement
    const read = () => setDusk(root.classList.contains('dark') ? 1 : 0)
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const handleHover = useCallback(
    (value: boolean) => {
      progress.destinationHovered = value
      setHovered(value)
    },
    [progress]
  )

  const handedOver = useRef(false)
  const timers = useRef<number[]>([])

  const goToCollection = useCallback(() => {
    if (handedOver.current) {
      return
    }
    handedOver.current = true
    void navigate({ to: '/worlds/$world', params: { world: world.slug } })
  }, [navigate, world.slug])

  /** Enter the world: fly in, resolve the photograph, then hand over. */
  const handleEnter = useCallback(() => {
    if (entering) {
      return
    }

    if (reducedMotion) {
      goToCollection()
      return
    }

    setEntering(true)
    progress.flying = true
    progress.flyProgress = 0

    /* The flight is driven by the render loop, and a render loop can stall —
       a backgrounded tab, a device that cannot keep up, a context loss. The
       visitor has already asked to go somewhere, so hand over regardless. */
    timers.current.push(window.setTimeout(goToCollection, Math.round(FLIGHT_SECONDS * 1000) + 1400))
  }, [entering, goToCollection, progress, reducedMotion])

  const handleEntered = useCallback(() => {
    setResolving(true)
    timers.current.push(window.setTimeout(goToCollection, 620))
  }, [goToCollection])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const ordinal = String(index + 1).padStart(2, '0')
  const last = index === total - 1

  return (
    <section
      ref={containerRef}
      id={`world-${world.slug}`}
      className="wander-journey"
      style={{ ['--journey-height' as string]: `${JOURNEY_HEIGHT_VH}svh` }}
      aria-label={`${world.name} — follow the light`}
      data-phase={phase}
      data-first={isFirst ? 'true' : undefined}
    >
      <div className="wander-journey__stage">
        <div
          className={`wander-journey__canvas ${quality === 'full' ? 'is-pointing' : ''}`}
          data-rendering={active ? 'true' : 'false'}
          data-quality={quality}
        >
          {mounted ? (
            <WorldScene
              form={form}
              palette={palette}
              heroPhotoId={world.heroId}
              progress={progress}
              quality={quality}
              dusk={dusk}
              active={active}
              hovered={hovered}
              onDestinationHover={handleHover}
              onDestinationSelect={handleEnter}
              onEntered={handleEntered}
              onReady={onReady}
              onFailed={onFailed}
            />
          ) : null}
        </div>

        {isFirst ? (
          <div className="wander-journey__chrome">
            <p className="mono-label wander-journey__mark">
              FrameOS <span aria-hidden="true">·</span> Pocket Worlds
            </p>
            <Link to="/archive" className="wander-journey__index">
              Open the Index <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : null}

        {/* the opening — only the first world introduces the site */}
        {isFirst ? (
          <div className="wander-journey__copy wander-journey__copy--opening">
            <h1 className="display-font wander-journey__title">
              Things I noticed, photographed on a phone.
            </h1>
            <p className="wander-journey__line">
              Five small worlds, joined by a thread of captured light. Follow it.
            </p>
            <div className="wander-journey__actions">
              <a href={onwardHref} className="pw-action pw-action--solid">
                Follow the light <span aria-hidden="true">↓</span>
              </a>
              <Link to="/archive" className="pw-action pw-action--glass">
                Skip to the Index
              </Link>
            </div>
          </div>
        ) : (
          <div className="wander-journey__copy wander-journey__copy--opening">
            <p className="mono-label">
              {ordinal} / {String(total).padStart(2, '0')}
            </p>
            <h2 className="display-font wander-journey__world-name">{world.name}</h2>
          </div>
        )}

        {/* the destination */}
        <div
          className={`wander-journey__copy wander-journey__copy--world ${hovered ? 'is-lit' : ''}`}
          style={{ ['--world-accent' as string]: world.mood.accent }}
        >
          <p className="mono-label">
            {ordinal} / {String(total).padStart(2, '0')} <span aria-hidden="true">·</span> World
          </p>
          <h2 className="display-font wander-journey__world-name">{world.name}</h2>
          <p className="display-italic wander-journey__line">{world.line}</p>
          <button
            type="button"
            className="pw-action pw-action--solid"
            onClick={handleEnter}
            onPointerEnter={() => handleHover(true)}
            onPointerLeave={() => handleHover(false)}
            onFocus={() => handleHover(true)}
            onBlur={() => handleHover(false)}
            aria-describedby={`enter-hint-${world.slug}`}
          >
            {entering ? 'Entering…' : `Enter ${world.name}`}
          </button>
          <span id={`enter-hint-${world.slug}`} className="sr-only">
            Opens the {world.name} collection.
          </span>
        </div>

        {/* the hand-off */}
        <div className="wander-journey__copy wander-journey__copy--onward">
          <p className="mono-label">The light continues</p>
          <p className="display-italic wander-journey__line">
            {last ? 'Every world, on one sheet.' : 'The next world is below.'}
          </p>
          <div className="wander-journey__actions">
            <a href={onwardHref} className="pw-action pw-action--solid">
              {last ? 'Open the Index' : 'Keep going'} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        {isFirst ? (
          <p className="wander-journey__hint" aria-hidden="true">
            Scroll to follow the light
          </p>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {phase === 'arrived' ? `Arrived at ${world.name}.` : ''}
        </p>

        {/* the photograph resolving as the collection opens */}
        {heroPhoto ? (
          <div
            className={`wander-journey__resolve ${resolving ? 'is-resolving' : ''}`}
            aria-hidden="true"
          >
            <img src={heroPhoto.src} srcSet={heroPhoto.srcSet} sizes="100vw" alt="" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
