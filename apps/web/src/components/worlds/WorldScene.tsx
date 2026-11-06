import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { WorldDome } from './WorldDome'

import type { World } from '@/types/content'
import type { Photo } from '@/types/photo'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * A world is one immersive object: its CMS-driven photo dome. Entrances are
 * CSS animations that start on the first painted frame, so the
 * server-rendered page is never hidden and re-revealed after hydration.
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
  const hasNeighbours = worldCount > 1

  return (
    <div
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
          {pad(worldIndex + 1)}
        </span>
        <div className="world-hero-copy">
          <p className="mono-label enter-focus">
            <Link to="/" hash="worlds" viewTransition className="link-glow no-underline">
              Worlds
            </Link>{' '}
            / {world.name} · {pad(photos.length)} {photos.length === 1 ? 'frame' : 'frames'}
          </p>
          <h1
            className="display-font enter-focus mt-5 text-[clamp(3.2rem,8vw,6rem)] leading-[0.9] font-light text-(--ink)"
            style={{ '--enter-delay': '70ms' } as React.CSSProperties}
          >
            {world.name}
          </h1>
          <p
            className="display-italic enter-focus mx-auto mt-5 max-w-xl text-lg text-(--muted-strong) sm:text-xl"
            style={{ '--enter-delay': '140ms' } as React.CSSProperties}
          >
            {world.line}
          </p>
          {world.description ? (
            <p
              className="enter-focus mx-auto mt-4 max-w-2xl text-sm leading-7 text-(--muted)"
              style={{ '--enter-delay': '210ms' } as React.CSSProperties}
            >
              {world.description}
            </p>
          ) : null}
          {hasNeighbours ? (
            <nav
              aria-label="Neighbouring worlds"
              className="world-hero-pager enter-focus"
              style={{ '--enter-delay': '280ms' } as React.CSSProperties}
            >
              <Link
                to="/worlds/$world"
                params={{ world: previousWorld.slug }}
                viewTransition
                aria-label={`Previous world: ${previousWorld.name}`}
              >
                <ArrowLeft aria-hidden="true" />
                <span>{previousWorld.name}</span>
              </Link>
              <span className="mono-label" aria-hidden="true">
                {pad(worldIndex + 1)} / {pad(worldCount)}
              </span>
              <Link
                to="/worlds/$world"
                params={{ world: nextWorld.slug }}
                viewTransition
                aria-label={`Next world: ${nextWorld.name}`}
              >
                <span>{nextWorld.name}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </nav>
          ) : null}
        </div>
      </header>

      <section
        className="world-dome-shell page-shell enter-focus"
        style={{ '--enter-delay': '220ms' } as React.CSSProperties}
        aria-label={`${world.name} photographs`}
      >
        {photos.length > 0 ? (
          <WorldDome world={world} photos={photos} />
        ) : (
          <div className="world-dome-empty">
            <p className="display-font m-0 text-3xl font-light">This world is waiting for light.</p>
            <p className="mt-3 text-sm text-(--muted)">
              No photographs have been published here yet. The rest of the archive is in the{' '}
              <Link to="/archive">Index</Link>.
            </p>
          </div>
        )}
      </section>

      <nav
        aria-label="World navigation"
        className="world-navigation page-shell mt-14 grid gap-3 border-t border-(--line) px-4 py-10 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"
      >
        {hasNeighbours ? (
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
        ) : (
          <span aria-hidden="true" />
        )}
        <Link
          to="/archive"
          search={{ world: world.slug }}
          viewTransition
          className="world-navigation-index mono-label no-underline"
        >
          <span aria-hidden="true">⌁</span>
          {world.name} in the Index
        </Link>
        {hasNeighbours ? (
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
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>

      <p className="sr-only">
        World {worldIndex + 1} of {worldCount}.
      </p>
    </div>
  )
}
