import { describe, expect, it } from 'vitest'

import { getPageTags, getPhotoTags } from '@/server/cache/tags'

describe('cache tag helpers', () => {
  it('returns all site-level page tags for site settings changes', () => {
    expect(getPageTags('siteSettings')).toEqual(['site', 'page:home', 'page:about', 'page:contact'])
  })

  it('builds gallery and detail tags from a photo record', () => {
    const tags = getPhotoTags({
      slug: 'night-walk',
      category: 'street',
      series: 'night',
      tags: ['featured', 'monochrome'],
    })

    expect(tags).toContain('gallery')
    expect(tags).toContain('gallery:category:street')
    expect(tags).toContain('gallery:series:night')
    expect(tags).toContain('gallery:tag:featured')
    expect(tags).toContain('gallery:tag:monochrome')
    expect(tags).toContain('photo:night-walk')
  })
})
