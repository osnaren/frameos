import { useRef } from 'react'

import { useGSAP } from '@gsap/react'
import { Link } from '@tanstack/react-router'
import gsap from 'gsap'

import { useHydratedReducedMotion } from '@/lib/motion'

import { WorldDome } from './WorldDome'

import type { World } from '@/types/content'
import type { Photo } from '@/types/photo'

gsap.registerPlugin(useGSAP)

/**
 * A world is one immersive object: its CMS-driven photo dome. The previous
 * stacked gallery repeated the exact same frames immediately below it and
 * made the globe feel like decoration instead of the collection itself.
 */
export function WorldScene({
  world,
  photos,
  worldIndex,
  worldCount,
  previousWorld,
  nextWorld,
}: {
  world: World
  photos: Photo[]
  worldIndex: number
  worldCount: number
  previousWorld: World
  nextWorld: World
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useHydratedReducedMotion()

  useGSAP(
    () => {
      if (reducedMotion) return

      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } })
      timeline
        .from('.world-hero-copy > *', {
          autoAlpha: 0,
          y: 18,
          filter: 'blur(7px)',
          duration: 0.85,
          stagger: 0.07,
          clearProps: 'filter',
        })
        .from(
          '.world-dome-shell',
          {
            autoAlpha: 0,
            y: 28,
            scale: 0.985,
            duration: 1.05,
          },
          '-=0.5'
        )
        .from(
          '.world-navigation',
          {
            autoAlpha: 0,
            y: 12,
            duration: 0.65,
          },
          '-=0.55'
        )
    },
    { scope: rootRef, dependencies: [world.slug, reducedMotion], revertOnUpdate: true }
  )

  return (
    <div
      ref={rootRef}
      className="world-scene"
      style={
        {
          '--world-wash': world.mood.wash,
          '--world-deep': world.mood.deep,
          '--world-accent': world.mood.accent,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[78vh] overflow-hidden"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, var(--world-wash) var(--wash-strength), transparent), transparent)`,
        }}
      >
        <span className="world-orbit world-orbit--one" />
        <span className="world-orbit world-orbit--two" />
      </div>

      <header className="world-hero page-shell relative px-4 pt-12 pb-8 text-center sm:pt-18 sm:pb-10">
        <span aria-hidden="true" className="world-hero-number">
          {String(worldIndex + 1).padStart(2, '0')}
        </span>
        <div className="world-hero-copy">
          <p className="mono-label">
            <Link to="/" hash="worlds" viewTransition className="link-glow no-underline">
              Worlds
            </Link>{' '}
            / {world.name} · {String(photos.length).padStart(2, '0')} frames
          </p>
          <h1 className="display-font mt-5 text-[clamp(3.2rem,8vw,6rem)] leading-[0.9] font-light text-(--ink)">
            {world.name}
          </h1>
          <p className="display-italic mx-auto mt-5 max-w-xl text-lg text-(--muted-strong) sm:text-xl">
            {world.line}
          </p>
          {world.description ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-(--muted)">
              {world.description}
            </p>
          ) : null}
        </div>
      </header>

      <section className="world-dome-shell page-shell" aria-label={`${world.name} globe gallery`}>
        {photos.length > 0 ? (
          <WorldDome world={world} photos={photos} />
        ) : (
          <div className="world-dome-empty">
            <p className="display-font m-0 text-3xl font-light">This world is waiting for light.</p>
            <p className="mt-3 text-sm text-(--muted)">
              Publish a photograph assigned to {world.name} and it will appear here automatically.
            </p>
          </div>
        )}
      </section>

      <nav
        aria-label="World navigation"
        className="world-navigation page-shell mt-14 grid gap-3 border-t border-(--line) px-4 py-10 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"
      >
        <Link
          to="/worlds/$world"
          params={{ world: previousWorld.slug }}
          viewTransition
          className="world-navigation-card world-navigation-card--previous no-underline"
        >
          <span className="mono-label">Previous world</span>
          <strong className="display-font">{previousWorld.name}</strong>
          <span aria-hidden="true">←</span>
        </Link>
        <Link
          to="/archive"
          viewTransition
          className="world-navigation-index mono-label no-underline"
        >
          <span aria-hidden="true">⌁</span>
          Index
        </Link>
        <Link
          to="/worlds/$world"
          params={{ world: nextWorld.slug }}
          viewTransition
          className="world-navigation-card world-navigation-card--next no-underline"
        >
          <span className="mono-label">Next world</span>
          <strong className="display-font">{nextWorld.name}</strong>
          <span aria-hidden="true">→</span>
        </Link>
      </nav>

      <p className="sr-only">
        World {worldIndex + 1} of {worldCount}.
      </p>
    </div>
  )
}
