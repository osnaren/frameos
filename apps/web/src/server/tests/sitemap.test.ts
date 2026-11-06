import { describe, expect, it } from 'vitest'

import { curatedPhotos, worlds } from '@/content/worlds'
import { createPortfolioRepository } from '@/server/repository/portfolio'
import {
  collectSitemapEntries,
  renderRobotsTxt,
  renderSitemapXml,
  STATIC_SITEMAP_PATHS,
} from '@/server/sitemap'

import type { Photo } from '@/types/photo'

const ORIGIN = 'https://frameos.example'

function photo(slug: string): Photo {
  const found = curatedPhotos.find((entry) => entry.slug === slug)
  if (!found) {
    throw new Error(`fixture photo ${slug} missing`)
  }
  return found
}

describe('collectSitemapEntries', () => {
  const entries = collectSitemapEntries({ origin: ORIGIN, worlds, photos: curatedPhotos })
  const locs = entries.map((entry) => entry.loc)

  it('lists the static pages, every active world, and every published photo', () => {
    for (const path of STATIC_SITEMAP_PATHS) {
      expect(locs).toContain(`${ORIGIN}${path}`)
    }

    const activeWorlds = worlds.filter((world) => world.status === 'active')
    for (const world of activeWorlds) {
      expect(locs).toContain(`${ORIGIN}/worlds/${world.slug}`)
    }

    const published = curatedPhotos.filter((entry) => entry.status === 'published')
    for (const entry of published) {
      expect(locs).toContain(`${ORIGIN}/photos/${entry.slug}`)
    }

    expect(entries).toHaveLength(
      STATIC_SITEMAP_PATHS.length + activeWorlds.length + published.length
    )
  })

  it('never lists the hidden People world or its draft portraits', () => {
    expect(locs.some((loc) => loc.includes('/worlds/people'))).toBe(false)
    expect(locs).not.toContain(`${ORIGIN}/photos/heart-frame`)
    expect(locs).not.toContain(`${ORIGIN}/photos/before-the-mandala`)
  })

  it('fails closed on a published photo filed under a hidden world', () => {
    const leaked: Photo = { ...photo('the-sea'), slug: 'leaked-portrait', category: 'people' }
    const unknown: Photo = { ...photo('the-sea'), slug: 'stray', category: 'no-such-world' }
    const result = collectSitemapEntries({
      origin: ORIGIN,
      worlds,
      photos: [leaked, unknown],
    }).map((entry) => entry.loc)

    expect(result).not.toContain(`${ORIGIN}/photos/leaked-portrait`)
    expect(result).not.toContain(`${ORIGIN}/photos/stray`)
  })

  it('skips photos without alt text, archived photos, and duplicates', () => {
    const result = collectSitemapEntries({
      origin: ORIGIN,
      worlds,
      photos: [
        { ...photo('the-sea'), slug: 'no-alt', alt: '  ' },
        { ...photo('the-sea'), slug: 'archived', status: 'archived' },
        photo('the-cat'),
        photo('the-cat'),
      ],
    }).filter((entry) => entry.loc.includes('/photos/'))

    expect(result.map((entry) => entry.loc)).toEqual([`${ORIGIN}/photos/the-cat`])
  })

  it('attaches the full-size image and only a real lastmod', () => {
    const [local] = collectSitemapEntries({
      origin: ORIGIN,
      worlds,
      photos: [photo('the-sea')],
    }).filter((entry) => entry.loc.includes('/photos/'))
    expect(local.images).toEqual([`${ORIGIN}/photos/the-sea/w2048.webp`])
    expect(local.lastmod).toBeUndefined()

    const edited: Photo = {
      ...photo('the-sea'),
      metadata: { ...photo('the-sea').metadata, updatedAt: '2026-10-01T12:00:00Z' },
    }
    const [sanity] = collectSitemapEntries({ origin: ORIGIN, worlds, photos: [edited] }).filter(
      (entry) => entry.loc.includes('/photos/')
    )
    expect(sanity.lastmod).toBe('2026-10-01T12:00:00.000Z')
  })
})

describe('renderSitemapXml', () => {
  it('renders a valid urlset with escaped URLs and image entries', () => {
    const xml = renderSitemapXml([
      { loc: `${ORIGIN}/`, lastmod: '2026-10-01T12:00:00.000Z' },
      {
        loc: `${ORIGIN}/photos/the-sea`,
        images: ['https://cdn.sanity.io/images/p/d/a.jpg?w=1600&fit=max'],
      },
    ])

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')
    expect(xml).toContain('<lastmod>2026-10-01T12:00:00.000Z</lastmod>')
    expect(xml).toContain(
      '<image:loc>https://cdn.sanity.io/images/p/d/a.jpg?w=1600&amp;fit=max</image:loc>'
    )
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/)
    expect(xml.trim().endsWith('</urlset>')).toBe(true)
  })
})

describe('renderRobotsTxt', () => {
  it('keeps /api/ out and points at the absolute sitemap URL', () => {
    const robots = renderRobotsTxt(ORIGIN)

    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
  })
})

describe('repository.getSitemapContent (fixture archive)', () => {
  it('returns only active worlds and published photos', async () => {
    const { worlds: active, photos } = await createPortfolioRepository().getSitemapContent()

    expect(active.every((world) => world.status === 'active')).toBe(true)
    expect(active.some((world) => world.slug === 'people')).toBe(false)
    expect(photos.every((entry) => entry.status === 'published')).toBe(true)
    expect(photos.some((entry) => entry.category === 'people')).toBe(false)
  })
})
