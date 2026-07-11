import { describe, expect, it } from 'vitest'

import { buildCloudinaryImageUrl, buildCloudinarySrcSet, imagePresetMap } from '@/lib/image-policy'

describe('image policy helpers', () => {
  it('builds transformed delivery URLs for the requested preset', () => {
    const url = buildCloudinaryImageUrl({
      cloudName: 'demo',
      publicId: 'portfolio/hero-shot',
      preset: 'hero',
    })

    expect(url).toContain('f_auto')
    expect(url).toContain('q_auto')
    expect(url).toContain('dpr_auto')
    expect(url).toContain('c_fill,g_auto')
    expect(url).toContain(`w_${imagePresetMap.hero.width}`)
  })

  it('limits generated srcset widths to the preset maximum', () => {
    const srcSet = buildCloudinarySrcSet({
      cloudName: 'demo',
      publicId: 'portfolio/detail-shot',
      preset: 'card',
    })

    expect(srcSet).toContain(' 320w')
    expect(srcSet).toContain(' 640w')
    expect(srcSet).not.toContain(' 768w')
  })
})
