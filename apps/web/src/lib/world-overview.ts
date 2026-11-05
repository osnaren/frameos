import type { World } from '@/types/content'
import type { Photo } from '@/types/photo'

/** Default and bounds for `World.planet.horizon` — see the Studio field description. */
export const DEFAULT_PLANET_HORIZON = 0.55
export const MIN_PLANET_HORIZON = 0.2
export const MAX_PLANET_HORIZON = 1.2

export function clampHorizon(value: number | undefined | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PLANET_HORIZON
  }
  return Math.min(MAX_PLANET_HORIZON, Math.max(MIN_PLANET_HORIZON, value))
}

/** How many photographs per world travel with the overview (the home contact strips). */
export const OVERVIEW_PHOTOS_PER_WORLD = 12

/**
 * One public world, resolved for the home page: its photographs, the frame
 * that leads it, and the frame its pocket planet is curled from.
 */
export interface WorldOverview {
  world: World
  /** Every published photograph in the world, not just those carried below. */
  photoCount: number
  /** The first `OVERVIEW_PHOTOS_PER_WORLD` photographs, in archive order. */
  photos: Photo[]
  lead: Photo
  planet: {
    photo: Photo
    horizon: number
  }
}

/**
 * Pairs worlds with their photographs.
 *
 * Everything here is driven by content: a new world appears as soon as it is
 * active and has at least one published photograph; its lead and planet
 * frames fall back to its first photograph when the editor hasn't chosen.
 * Worlds with nothing published yet are left out rather than shown empty.
 *
 * `worlds` must already be the public, ordered set; `photos` the published
 * archive in display order.
 */
export function buildWorldOverviews(worlds: World[], photos: Photo[]): WorldOverview[] {
  const bySlug = new Map(photos.map((photo) => [photo.slug, photo]))

  return worlds.flatMap((world) => {
    const inWorld = photos.filter((photo) => photo.category === world.slug)

    if (inWorld.length === 0) {
      return []
    }

    /* the lead must belong to the world; the planet may borrow any published frame */
    const lead = inWorld.find((photo) => photo.slug === world.heroPhoto?.slug) ?? inWorld[0]
    const planetPhoto = (world.planet?.photo && bySlug.get(world.planet.photo.slug)) || lead

    /* open the strip on the frame the home page unrolls, then the lead */
    const first = inWorld.includes(planetPhoto) ? planetPhoto : lead
    const ordered = [
      first,
      ...(first === lead ? [] : [lead]),
      ...inWorld.filter((photo) => photo !== first && photo !== lead),
    ]

    return [
      {
        world,
        photoCount: inWorld.length,
        photos: ordered.slice(0, OVERVIEW_PHOTOS_PER_WORLD),
        lead,
        planet: {
          photo: planetPhoto,
          horizon: clampHorizon(world.planet?.horizon),
        },
      },
    ]
  })
}
