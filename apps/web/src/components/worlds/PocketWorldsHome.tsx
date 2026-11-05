import { Suspense, lazy, useCallback, useEffect, useState } from 'react'

import { ClientOnly } from '@tanstack/react-router'

import { getJourneyWorlds } from '@/content/worlds'
import { detectExperienceTier, type ExperienceTier } from '@/lib/capability'

import { PocketWorldsFallback } from './PocketWorldsFallback'

/**
 * The Pocket Worlds home.
 *
 * Three states, in one order of preference:
 *
 *   1. the spatial journey — one miniature model per world, scrolled through
 *      in sequence, for devices that can run it and visitors who have not
 *      asked for less motion,
 *   2. the still cinematic — the scroll-scrubbed keyframe journey,
 *   3. the plain DOM page — always rendered, always complete.
 *
 * The server always produces (3), so the page is readable before any of the
 * runtime has been fetched. The tier is only resolved after mount, and the
 * heavier layers are code-split behind it, so nothing 3D is downloaded by a
 * phone on a slow connection or by a visitor with reduced motion.
 *
 * Which worlds appear, in what order, with what colour and on what landform
 * all come from the CMS. This component only decides *how* to draw them.
 */

const SpatialJourney = lazy(() => import('./spatial/SpatialJourney'))
const PocketWorldsCinematic = lazy(() => import('./cinematic/PocketWorldsCinematic'))

export function PocketWorldsHome({
  frameCount,
  worldCounts,
}: {
  frameCount: number
  worldCounts: Readonly<Record<string, number>>
}) {
  /* `null` until the tier is known, so nothing heavy is mounted speculatively */
  const [tier, setTier] = useState<ExperienceTier | null>(null)
  const [journeyReady, setJourneyReady] = useState(false)
  const [journeyFailed, setJourneyFailed] = useState(false)
  const [cinematicReady, setCinematicReady] = useState(false)

  useEffect(() => {
    setTier(detectExperienceTier())
  }, [])

  const handleJourneyFailed = useCallback(() => {
    setJourneyFailed(true)
    setJourneyReady(false)
  }, [])

  const handleJourneyReady = useCallback(() => setJourneyReady(true), [])
  const handleCinematicReady = useCallback(() => setCinematicReady(true), [])

  const spatial = tier !== null && tier !== 'animated' && !journeyFailed
  /* Worlds the journey is carrying, so the DOM list below can skip them. */
  const covered = spatial && journeyReady ? getJourneyWorlds().map((world) => world.slug) : []

  return (
    <>
      {spatial ? (
        <ClientOnly>
          <Suspense fallback={null}>
            <SpatialJourney
              quality={tier === 'spatial' ? 'full' : 'lite'}
              onReady={handleJourneyReady}
              onFailed={handleJourneyFailed}
            />
          </Suspense>
        </ClientOnly>
      ) : null}

      {/* Hidden rather than unmounted: the journey can still fail late, and
          this is what it falls back to. */}
      <div hidden={cinematicReady}>
        <PocketWorldsFallback
          frameCount={frameCount}
          worldCounts={worldCounts}
          hideHero={spatial && journeyReady}
          coveredWorlds={covered}
        />
      </div>

      {tier === 'animated' ? (
        <ClientOnly>
          <Suspense fallback={null}>
            <PocketWorldsCinematic onReady={handleCinematicReady} />
          </Suspense>
        </ClientOnly>
      ) : null}
    </>
  )
}
