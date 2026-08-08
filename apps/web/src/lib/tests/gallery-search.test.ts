import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GALLERY_LIMIT,
  MAX_GALLERY_LIMIT,
  buildCanonicalArchiveSearch,
  buildCanonicalGallerySearch,
  validateGallerySearch,
} from '@/lib/gallery-search'

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
