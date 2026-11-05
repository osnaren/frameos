/**
 * sitemap.xml and robots.txt, built from repository data. Pure functions —
 * the routes in routes/sitemap[.]xml.ts and routes/robots[.]txt.ts only add
 * the request origin and cache headers.
 *
 * Privacy is fail-closed: a photo is listed only if it is published, has alt
 * text (the repository's own publish rule), and either has no world or
 * belongs to an active one. Hidden worlds (e.g. People) and their photos
 * never appear, even if a photo inside them was published by mistake.
 */
import { getPhotoFullImage } from '@/lib/seo'

import type { World } from '@/types/content'
import type { Photo } from '@/types/photo'

/** Public, indexable pages that aren't driven by content. Legacy redirects stay out. */
export const STATIC_SITEMAP_PATHS = ['/', '/archive', '/notes', '/signal'] as const

export interface SitemapEntry {
  loc: string
  lastmod?: string
  images?: string[]
}

function isListablePhoto(photo: Photo, publicWorlds: Set<string>) {
  if (photo.status !== 'published' || !photo.alt.trim()) {
    return false
  }

  return !photo.category || publicWorlds.has(photo.category)
}

function toLastmod(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function collectSitemapEntries(input: {
  origin: string
  worlds: World[]
  photos: Photo[]
}): SitemapEntry[] {
  const url = (path: string) => new URL(path, input.origin).toString()
  const publicWorlds = input.worlds.filter((world) => world.status === 'active')
  const publicWorldSlugs = new Set(publicWorlds.map((world) => world.slug))
  const seen = new Set<string>()
  const entries: SitemapEntry[] = []

  const add = (entry: SitemapEntry) => {
    if (!seen.has(entry.loc)) {
      seen.add(entry.loc)
      entries.push(entry)
    }
  }

  STATIC_SITEMAP_PATHS.forEach((path) => add({ loc: url(path) }))
  publicWorlds.forEach((world) => add({ loc: url(`/worlds/${encodeURIComponent(world.slug)}`) }))

  input.photos
    .filter((photo) => isListablePhoto(photo, publicWorldSlugs))
    .forEach((photo) => {
      const image = getPhotoFullImage(photo, input.origin)
      add({
        loc: url(`/photos/${encodeURIComponent(photo.slug)}`),
        // Only Sanity supplies a real edit time; the fixture's createdAt is synthetic.
        lastmod: toLastmod(photo.metadata.updatedAt),
        images: image ? [image.url] : undefined,
      })
    })

  return entries
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderSitemapXml(entries: SitemapEntry[]) {
  const urls = entries.map((entry) => {
    const lines = [`    <loc>${escapeXml(entry.loc)}</loc>`]
    if (entry.lastmod) {
      lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
    }
    for (const image of entry.images ?? []) {
      lines.push(`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`)
    }
    return `  <url>\n${lines.join('\n')}\n  </url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

export function renderRobotsTxt(origin: string) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
    '',
  ].join('\n')
}
