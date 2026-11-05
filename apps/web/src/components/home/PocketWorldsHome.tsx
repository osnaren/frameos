import { useEffect, useState, type CSSProperties } from 'react'

import { Link } from '@tanstack/react-router'

import { useHydratedReducedMotion } from '@/lib/motion'

import { resolveChapterMode, type ChapterMode } from './chapter-mode'
import { HomeOrrery } from './HomeOrrery'
import { PlanetStill } from './planet/PlanetStill'
import { WorldChapter } from './WorldChapter'

import type { WorldOverview } from '@/lib/world-overview'
import type { HomePageContent } from '@/types/content'

/**
 * Pocket Worlds — the home page.
 *
 * Every world is one photograph curled into a tiny planet. The page opens on
 * all of them at once (the orrery), then visits each in turn: its planet
 * unrolls into the frame it came from, which opens onto the rest of that
 * world. It closes on the Index.
 *
 * Everything is content-driven. A world appears here as soon as it is active
 * and has a published photograph; its colours, order, planet photo and
 * horizon all come from the CMS.
 */
export function PocketWorldsHome({
  page,
  overviews,
}: {
  page: Pick<HomePageContent, 'eyebrow' | 'headline' | 'intro'>
  overviews: WorldOverview[]
}) {
  const reducedMotion = useHydratedReducedMotion()
  const [mode, setMode] = useState<ChapterMode>('static')
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const totalFrames = overviews.reduce((sum, overview) => sum + overview.photoCount, 0)

  useEffect(() => {
    setMode(resolveChapterMode(reducedMotion))
  }, [reducedMotion])

  /* which chapter holds the middle of the viewport — drives the rail */
  useEffect(() => {
    const sections = overviews
      .map((overview) => document.getElementById(`world-${overview.world.slug}`))
      .filter((element): element is HTMLElement => Boolean(element))

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const slug = entry.target.id.replace(/^world-/, '')
          if (entry.isIntersecting) {
            setActiveSlug(slug)
          } else {
            setActiveSlug((current) => (current === slug ? null : current))
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [overviews, mode])

  if (overviews.length === 0) {
    return <EmptyArchive page={page} />
  }

  return (
    <div className="pocket-home" data-mode={mode}>
      <HomeOrrery page={page} overviews={overviews} totalFrames={totalFrames} />

      <nav
        className="chapter-rail"
        aria-label="Worlds on this page"
        data-visible={activeSlug ? 'true' : 'false'}
      >
        <ol>
          {overviews.map((overview, index) => (
            <li key={overview.world.slug}>
              <a
                href={`#world-${overview.world.slug}`}
                className="chapter-rail__link"
                aria-current={activeSlug === overview.world.slug ? 'location' : undefined}
                style={{ '--world-accent': overview.world.mood.accent } as CSSProperties}
              >
                <PlanetStill
                  photo={overview.planet.photo}
                  horizon={overview.planet.horizon}
                  cssSize={44}
                  className="chapter-rail__planet"
                />
                <span className="chapter-rail__label">
                  <span className="chapter-rail__index">{String(index + 1).padStart(2, '0')}</span>
                  {overview.world.name}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="pocket-home__chapters">
        {overviews.map((overview, index) => (
          <WorldChapter
            key={overview.world.slug}
            overview={overview}
            index={index}
            total={overviews.length}
            mode={mode}
            active={activeSlug === overview.world.slug}
          />
        ))}
      </div>

      <section className="home-closing page-shell" aria-labelledby="home-closing-title">
        <p className="mono-label">
          The archive <span aria-hidden="true">·</span> {totalFrames} frames{' '}
          <span aria-hidden="true">·</span> {overviews.length}{' '}
          {overviews.length === 1 ? 'world' : 'worlds'}
        </p>
        <h2 id="home-closing-title" className="display-font home-closing__title">
          Every world, on one sheet.
        </h2>
        <ul className="home-closing__planets" aria-label="Jump to a world">
          {overviews.map((overview) => (
            <li key={overview.world.slug}>
              <Link
                to="/worlds/$world"
                params={{ world: overview.world.slug }}
                className="home-closing__planet"
                style={{ '--world-accent': overview.world.mood.accent } as CSSProperties}
              >
                <PlanetStill
                  photo={overview.planet.photo}
                  horizon={overview.planet.horizon}
                  glow={overview.world.mood.wash}
                  cssSize={120}
                  className="home-closing__planet-body"
                />
                <span className="mono-label">{overview.world.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="home-closing__actions">
          <Link to="/archive" className="home-action home-action--solid">
            Open the Index
          </Link>
          <Link to="/notes" className="home-action home-action--line">
            Read the Field Notes
          </Link>
          <Link to="/signal" className="home-action home-action--line">
            Send a Signal
          </Link>
        </div>
      </section>
    </div>
  )
}

function EmptyArchive({ page }: { page: Pick<HomePageContent, 'headline' | 'intro'> }) {
  return (
    <section className="home-closing page-shell" aria-labelledby="home-empty-title">
      <p className="mono-label">Pocket Worlds</p>
      <h1 id="home-empty-title" className="display-font home-closing__title">
        {page.headline}
      </h1>
      <p className="orrery__intro">
        The first worlds are still developing. Check back soon, or send a signal in the meantime.
      </p>
      <div className="home-closing__actions">
        <Link to="/signal" className="home-action home-action--solid">
          Send a Signal
        </Link>
      </div>
    </section>
  )
}
