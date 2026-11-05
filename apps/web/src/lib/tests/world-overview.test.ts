import { describe, expect, it } from 'vitest'

import { buildWorldOverviews, clampHorizon, DEFAULT_PLANET_HORIZON } from '@/lib/world-overview'

import type { World } from '@/types/content'
import type { Photo } from '@/types/photo'

function photo(slug: string, category: string): Photo {
  return {
    publicId: `local/${slug}`,
    slug,
    status: 'published',
    title: slug,
    alt: slug,
    category,
    sortOrder: 0,
    metadataVersion: 'v2',
    tags: [],
    metadata: { width: 100, height: 100, format: 'webp', bytes: 1, createdAt: '2026-01-01' },
  }
}

function world(slug: string, extra: Partial<World> = {}): World {
  return {
    slug,
    name: slug,
    line: slug,
    sortOrder: 0,
    status: 'active',
    mood: { wash: '#ffffff', deep: '#000000', accent: '#888888' },
    ...extra,
  }
}

describe('buildWorldOverviews', () => {
  const photos = [photo('a1', 'a'), photo('a2', 'a'), photo('a3', 'a'), photo('b1', 'b')]

  it('pairs each world with its own photographs and true count', () => {
    const [a, b] = buildWorldOverviews([world('a'), world('b')], photos)
    expect(a.photoCount).toBe(3)
    expect(a.photos.map((entry) => entry.slug)).toEqual(['a1', 'a2', 'a3'])
    expect(b.photoCount).toBe(1)
  })

  it('leaves out worlds with nothing published yet', () => {
    expect(buildWorldOverviews([world('a'), world('empty')], photos)).toHaveLength(1)
  })

  it('falls back to the first photograph for the lead and the planet', () => {
    const [a] = buildWorldOverviews([world('a')], photos)
    expect(a.lead.slug).toBe('a1')
    expect(a.planet.photo.slug).toBe('a1')
    expect(a.planet.horizon).toBe(DEFAULT_PLANET_HORIZON)
  })

  it('uses the editor-chosen lead, planet photo and horizon, and opens the strip on the planet', () => {
    const [a] = buildWorldOverviews(
      [
        world('a', {
          heroPhoto: { slug: 'a2' },
          planet: { photo: { slug: 'a3' }, horizon: 0.9 },
        }),
      ],
      photos
    )
    expect(a.lead.slug).toBe('a2')
    expect(a.planet.photo.slug).toBe('a3')
    expect(a.planet.horizon).toBe(0.9)
    expect(a.photos.map((entry) => entry.slug)).toEqual(['a3', 'a2', 'a1'])
  })

  it('ignores a lead from another world and an unknown planet photo', () => {
    const [a] = buildWorldOverviews(
      [world('a', { heroPhoto: { slug: 'b1' }, planet: { photo: { slug: 'missing' } } })],
      photos
    )
    expect(a.lead.slug).toBe('a1')
    expect(a.planet.photo.slug).toBe('a1')
  })

  it('lets the planet borrow a published frame from another world', () => {
    const [a] = buildWorldOverviews([world('a', { planet: { photo: { slug: 'b1' } } })], photos)
    expect(a.planet.photo.slug).toBe('b1')
    expect(a.photos[0].slug).toBe('a1')
  })
})

describe('clampHorizon', () => {
  it('defaults and clamps', () => {
    expect(clampHorizon(undefined)).toBe(DEFAULT_PLANET_HORIZON)
    expect(clampHorizon(Number.NaN)).toBe(DEFAULT_PLANET_HORIZON)
    expect(clampHorizon(0)).toBe(0.2)
    expect(clampHorizon(9)).toBe(1.2)
    expect(clampHorizon(0.7)).toBe(0.7)
  })
})
