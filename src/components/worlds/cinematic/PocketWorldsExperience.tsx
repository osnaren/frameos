import { lazy, Suspense, useCallback, useState } from 'react'

import { ClientOnly, Link } from '@tanstack/react-router'

import { pocketWorldHero, pocketWorldJourney } from '@/content/pocket-worlds-journey'

const PocketWorldsCinematic = lazy(() => import('./PocketWorldsCinematic'))

export function PocketWorldsExperience({
  frameCount,
  worldCounts,
}: {
  frameCount: number
  worldCounts: Readonly<Record<string, number>>
}) {
  const [enhanced, setEnhanced] = useState(false)
  const handleReady = useCallback(() => setEnhanced(true), [])

  return (
    <>
      <section className="pw-basic" aria-label="Pocket Worlds" hidden={enhanced}>
        <div className="pw-basic__hero">
          <img
            src={pocketWorldJourney[0].fallbackImage}
            srcSet={pocketWorldJourney[0].fallbackSrcSet}
            sizes="100vw"
            alt=""
            className="pw-basic__hero-image"
          />
          <div className="pw-basic__hero-wash" aria-hidden="true" />
          <div className="page-shell pw-basic__hero-copy">
            <p className="section-label">{pocketWorldHero.eyebrow}</p>
            <h1 className="display-font">{pocketWorldHero.title}</h1>
            <p>{pocketWorldHero.body}</p>
            <div className="pw-basic__actions">
              <a href="#pocket-world-list" className="pw-action pw-action--solid">
                Begin the journey
              </a>
              <Link to="/archive" className="pw-action pw-action--glass">
                Open the Index
              </Link>
            </div>
          </div>
        </div>

        <div id="pocket-world-list" className="page-shell pw-basic__worlds">
          <div className="pw-basic__intro">
            <p className="mono-label">Five worlds · {String(frameCount).padStart(2, '0')} frames</p>
            <p className="display-italic">A small archive, connected by captured light.</p>
          </div>

          {pocketWorldJourney.map((scene, index) => (
            <article
              key={scene.id}
              className="pw-basic__world"
              style={{ '--pw-accent': scene.accent } as React.CSSProperties}
            >
              <div className="pw-basic__world-image-wrap">
                <img
                  src={scene.fallbackImage}
                  srcSet={scene.fallbackSrcSet}
                  sizes="(max-width: 760px) 92vw, 58vw"
                  alt={scene.fallbackAlt}
                  loading="lazy"
                  className="pw-basic__world-image"
                />
                <span className="pw-basic__world-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="pw-basic__world-copy">
                <p className="mono-label">{scene.eyebrow}</p>
                <h2 className="display-font">{scene.title}</h2>
                <p>{scene.body}</p>
                <Link
                  to="/worlds/$world"
                  params={{ world: scene.worldSlug }}
                  className="pw-basic__world-link"
                >
                  {scene.action}
                  <span aria-hidden="true"> ↗</span>
                </Link>
                <span className="mono-label pw-basic__count">
                  {String(worldCounts[scene.worldSlug] ?? 0).padStart(2, '0')} frames
                </span>
              </div>
            </article>
          ))}

          <section className="pw-basic__closing" aria-labelledby="pw-basic-closing-title">
            <p className="mono-label">The archive</p>
            <h2 id="pw-basic-closing-title" className="display-font">
              Every world, on one sheet.
            </h2>
            <div className="pw-basic__actions">
              <Link to="/archive" className="pw-action pw-action--solid">
                Open the Index
              </Link>
              <Link to="/notes" className="pw-action pw-action--line">
                Read the Field Notes
              </Link>
              <Link to="/signal" className="pw-action pw-action--line">
                Send a Signal
              </Link>
            </div>
          </section>
        </div>
      </section>

      <ClientOnly>
        <Suspense fallback={null}>
          <PocketWorldsCinematic onReady={handleReady} />
        </Suspense>
      </ClientOnly>
    </>
  )
}
