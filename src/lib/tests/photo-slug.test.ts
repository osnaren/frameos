import { describe, expect, it } from 'vitest'

import { createPhotoSlug, decodePhotoSlug } from '@/lib/photo-slug'

describe('photo slug helpers', () => {
  it('encodes and decodes the full public id', () => {
    const publicId = 'portfolio/street/night-walk'
    const slug = createPhotoSlug(publicId)

    expect(slug).toContain('night-walk')
    expect(decodePhotoSlug(slug)).toBe(publicId)
  })

  it('returns null for malformed slugs', () => {
    expect(decodePhotoSlug('not-a-valid-photo-slug')).toBeNull()
  })
})
