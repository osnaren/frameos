import { useCallback, useMemo, useRef } from 'react'

import { getJourneyWorlds } from '@/content/worlds'

import { formFor } from './forms'
import { WorldJourney } from './kit/WorldJourney'

import type { Quality } from './kit/types'

/**
 * The home journey: every world with a model form, in CMS order.
 *
 * Each world gets its own scroll section and its own canvas, and only the
 * section on screen is rendering — the rest sit at `frameloop: 'never'`, so
 * five worlds cost about what one costs. That is also what makes the set
 * extensible: a sixth world is a CMS entry, not a performance decision.
 *
 * The thread of light does not literally span the sections, but each world
 * begins with it entering the frame and ends with it leaving, so scrolling
 * from one to the next reads as continuing to follow it.
 */
export default function SpatialJourney({
  quality,
  onReady,
  onFailed,
}: {
  quality: Quality
  onReady: () => void
  onFailed: () => void
}) {
  /* Only worlds the CMS has given a form to appear here. The rest are still
     in the index and still have their own collection — they just have no
     scene, which is a content decision rather than a code one. */
  const worlds = useMemo(
    () =>
      getJourneyWorlds()
        .map((world) => ({ world, form: formFor(world) }))
        .filter(
          (
            entry
          ): entry is { world: (typeof entry)['world']; form: NonNullable<typeof entry.form> } =>
            Boolean(entry.form)
        ),
    []
  )

  /* One `onReady` for the page, from whichever world mounts first. */
  const announced = useRef(false)
  const handleReady = useCallback(() => {
    if (announced.current) {
      return
    }
    announced.current = true
    onReady()
  }, [onReady])

  if (worlds.length === 0) {
    return null
  }

  return (
    <div className="spatial-journey">
      {worlds.map(({ world, form }, index) => (
        <WorldJourney
          key={world.slug}
          world={world}
          form={form}
          quality={quality}
          index={index}
          total={worlds.length}
          isFirst={index === 0}
          onwardHref={
            index === worlds.length - 1
              ? '#pocket-worlds-closing'
              : `#world-${worlds[index + 1].world.slug}`
          }
          onReady={handleReady}
          onFailed={onFailed}
        />
      ))}
    </div>
  )
}
