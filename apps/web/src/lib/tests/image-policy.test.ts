import { describe, expect, it } from 'vitest'

import { buildSanityImageUrl, buildSanitySrcSet, imagePresetMap } from '@/lib/image-policy'

describe('image policy helpers', () => {
  it('builds transformed delivery URLs for the requested preset', () => {
    const url = buildSanityImageUrl({
      baseUrl: 'https://cdn.sanity.io/images/proj/production/hero-shot-1920x1200.jpg',
      preset: 'hero',
    })

    expect(url).toContain('auto=format')
    expect(url).toContain('q=75')
    expect(url).toContain('fit=crop')
    expect(url).toContain('crop=focalpoint')
    expect(url).toContain(`w=${imagePresetMap.hero.width}`)
  })

  it('limits generated srcset widths to the preset maximum', () => {
    const srcSet = buildSanitySrcSet({
      baseUrl: 'https://cdn.sanity.io/images/proj/production/detail-shot-1600x2000.jpg',
      preset: 'card',
    })

    expect(srcSet).toContain(' 320w')
    expect(srcSet).toContain(' 640w')
    expect(srcSet).not.toContain(' 768w')
  })
})
