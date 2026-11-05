import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GALLERY_LIMIT,
  MAX_GALLERY_LIMIT,
  buildCanonicalArchiveSearch,
  buildCanonicalGallerySearch,
  filterArchiveItems,
  hasArchiveFilters,
  isInPublicWorld,
  mergeFeedPages,
  sanitizeArchiveFilters,
  summarizeArchiveFacets,
  validateGallerySearch,
} from '@/lib/gallery-search'

function item(slug: string, category: string, tags: string[], series?: string) {
  return { photo: { slug, category, tags, series } }
}

const archive = [
  item('the-sea', 'wander', ['sea', 'horizon']),
  item('the-waterfall', 'wander', ['hills', 'water']),
  item('rain-on-the-street', 'small-wonders', ['rain', 'street']),
  item('leaf-after-rain', 'small-wonders', ['rain', 'macro'], 'monsoon'),
  item('grazing', 'living-things', ['cattle', 'hills']),
]

describe('gallery search helpers', () => {
  it('clamps the gallery limit to the supported max', () => {
    const parsed = validateGallerySearch({
      limit: '999',
    })

    expect(parsed.limit).toBe(MAX_GALLERY_LIMIT)
  })

  it('falls back to the default limit for invalid input', () => {
    const parsed = validateGallerySearch({
      limit: 'abc',
    })

    expect(parsed.limit).toBe(DEFAULT_GALLERY_LIMIT)
  })

  it('builds canonical search params in the expected order', () => {
    const query = buildCanonicalGallerySearch({
      category: 'street',
      series: 'night-walks',
      tag: 'featured',
      after: 'cursor-token',
      limit: DEFAULT_GALLERY_LIMIT,
    })

    expect(query).toBe('category=street&series=night-walks&tag=featured&after=cursor-token')
  })

  it('maps the internal category filter to the public Index world parameter', () => {
    expect(buildCanonicalArchiveSearch({ category: 'wander' })).toBe('world=wander')
    expect(buildCanonicalArchiveSearch({})).toBe('')
  })
})

describe('Index filters', () => {
  it('combines world, tag and series filters', () => {
    expect(filterArchiveItems(archive, { tag: 'rain' }).map((entry) => entry.photo.slug)).toEqual([
      'rain-on-the-street',
      'leaf-after-rain',
    ])
    expect(filterArchiveItems(archive, { world: 'wander', tag: 'hills' })).toHaveLength(1)
    expect(filterArchiveItems(archive, { series: 'monsoon' })).toHaveLength(1)
    expect(filterArchiveItems(archive, { world: 'wander', tag: 'rain' })).toEqual([])
    expect(filterArchiveItems(archive, {})).toHaveLength(archive.length)
  })

  it('keeps photos from non-public worlds off public surfaces', () => {
    expect(isInPublicWorld({ category: 'wander' }, ['wander'])).toBe(true)
    expect(isInPublicWorld({ category: 'people' }, ['wander'])).toBe(false)
    expect(isInPublicWorld({}, ['wander'])).toBe(true)
  })

  it('reports whether any filter is active', () => {
    expect(hasArchiveFilters({})).toBe(false)
    expect(hasArchiveFilters({ tag: 'rain' })).toBe(true)
  })

  it('drops world filters that are not public', () => {
    expect(sanitizeArchiveFilters({ world: 'people', tag: 'portrait' }, ['wander'])).toEqual({
      world: undefined,
      tag: 'portrait',
      series: undefined,
    })
    expect(sanitizeArchiveFilters({ world: 'wander' }, ['wander']).world).toBe('wander')
  })

  it('derives facet counts from the data, scoping tags to the active world', () => {
    const all = summarizeArchiveFacets(archive, {})
    expect(all.total).toBe(5)
    expect(all.worlds).toEqual([
      { value: 'small-wonders', count: 2 },
      { value: 'wander', count: 2 },
      { value: 'living-things', count: 1 },
    ])
    expect(all.tags.slice(0, 2)).toEqual([
      { value: 'hills', count: 2 },
      { value: 'rain', count: 2 },
    ])
    expect(all.series).toEqual([{ value: 'monsoon', count: 1 }])

    const wander = summarizeArchiveFacets(archive, { world: 'wander' })
    expect(wander.worlds).toEqual(all.worlds)
    expect(wander.tags.map((facet) => facet.value)).toEqual(['hills', 'horizon', 'sea', 'water'])
  })

  it('merges cursor pages without duplicates', () => {
    const merged = mergeFeedPages([archive.slice(0, 3), archive.slice(2)])
    expect(merged.map((entry) => entry.photo.slug)).toEqual(
      archive.map((entry) => entry.photo.slug)
    )
  })
})
