import { describe, expect, it } from 'vitest'

import {
  buildSanityImageUrl,
  buildSanitySrcSet,
  contactSheetTileSizes,
  containedImageSizes,
  imagePresetMap,
} from '@/lib/image-policy'

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

  it('caps contained sizes by width and by height scaled to the aspect ratio', () => {
    const sizes = containedImageSizes(1103, 1958, [
      { media: '(max-width: 640px)', maxWidths: ['calc(100vw - 2rem)'], maxHeights: ['54vh'] },
      { maxWidths: ['76vw'], maxHeights: ['58vh', '40rem'] },
    ])

    expect(sizes).toBe(
      '(max-width: 640px) min(calc(100vw - 2rem), calc(54vh * 0.563)), min(76vw, calc(58vh * 0.563), calc(40rem * 0.563))'
    )
  })

  it('emits a plain length when a rule has a single cap', () => {
    expect(containedImageSizes(0, 0, [{ maxWidths: ['100vw'], maxHeights: [] }])).toBe('100vw')
  })

  it('sizes contact-sheet tiles in proportion to their shape', () => {
    expect(contactSheetTileSizes(1103, 1958)).toBe('(max-width: 640px) 30vw, 158px')
    expect(contactSheetTileSizes(2048, 1153)).toBe('(max-width: 640px) 92vw, 497px')
    expect(contactSheetTileSizes(0, 0)).toBe('(max-width: 640px) 52vw, 280px')
  })
})
