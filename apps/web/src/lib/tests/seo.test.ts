import { existsSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { LOCAL_PUBLIC_ID_PREFIX, curatedPhotos, getManifestEntry } from '@/content/worlds'
import {
  DEFAULT_SHARE_IMAGE,
  LOCAL_PHOTO_PREFIX,
  buildSeoHead,
  collectionPageJsonLd,
  getPhotoFullImage,
  getPhotoShareImage,
  photographJsonLd,
} from '@/lib/seo'

import type { Photo } from '@/types/photo'

const ORIGIN = 'https://frameos.example'
const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../../public')

function photo(slug: string) {
  const found = curatedPhotos.find((entry) => entry.slug === slug)
  if (!found) {
    throw new Error(`fixture photo ${slug} missing`)
  }
  return found
}

const sanityPhoto: Photo = {
  ...photo('the-sea'),
  publicId: 'https://cdn.sanity.io/images/proj/production/sea-2048x1153.jpg',
  image: { hotspot: { x: 0.3, y: 0.6 } },
}

function metaContent(head: ReturnType<typeof buildSeoHead>, key: string) {
  const entry = head.meta.find((item) => item.property === key || item.name === key)
  return entry?.content
}

describe('getPhotoShareImage', () => {
  it('uses the 1440px variant for large local photos', () => {
    expect(getPhotoShareImage(photo('the-sea'), ORIGIN)).toEqual({
      url: `${ORIGIN}/photos/the-sea/w1440.webp`,
      width: 1440,
      height: 811,
      type: 'image/webp',
      alt: photo('the-sea').alt,
    })
  })

  it('uses the original width when a local photo is narrower than 1440px', () => {
    expect(getPhotoShareImage(photo('the-cat'), ORIGIN)?.url).toBe(
      `${ORIGIN}/photos/the-cat/w1103.webp`
    )
  })

  it('requests an exact 1200x630 hotspot-aware JPEG from the Sanity CDN', () => {
    const image = getPhotoShareImage(sanityPhoto, ORIGIN)
    expect(image).not.toBeNull()
    const url = new URL(image?.url ?? 'about:blank')

    expect(image).toMatchObject({ width: 1200, height: 630, type: 'image/jpeg' })
    expect(url.searchParams.get('w')).toBe('1200')
    expect(url.searchParams.get('h')).toBe('630')
    expect(url.searchParams.get('fm')).toBe('jpg')
    expect(url.searchParams.has('auto')).toBe(false)
    expect(url.searchParams.get('fp-x')).toBe('0.3')
  })

  it('returns null for an unknown public id scheme', () => {
    expect(getPhotoShareImage({ ...photo('the-sea'), publicId: 'mystery' }, ORIGIN)).toBeNull()
  })
})

describe('local variant assumptions', () => {
  it('keeps the duplicated local prefix in sync with content/worlds', () => {
    expect(LOCAL_PHOTO_PREFIX).toBe(LOCAL_PUBLIC_ID_PREFIX)
  })

  it.each(curatedPhotos.filter((entry) => entry.status === 'published').map((p) => [p.slug, p]))(
    '%s has its share and full-size variants on disk',
    (slug, entry) => {
      const manifest = getManifestEntry(slug)
      expect(manifest).toBeDefined()
      for (const image of [getPhotoShareImage(entry, ORIGIN), getPhotoFullImage(entry, ORIGIN)]) {
        expect(image).not.toBeNull()
        const url = image?.url ?? ''
        const width = Number(/\/w(\d+)\.webp$/.exec(url)?.[1])
        expect(manifest?.widths).toContain(width)
        expect(existsSync(path.join(PUBLIC_DIR, new URL(url, ORIGIN).pathname))).toBe(true)
      }
    }
  )

  it('ships the default share image', () => {
    expect(existsSync(path.join(PUBLIC_DIR, DEFAULT_SHARE_IMAGE.path))).toBe(true)
  })
})

describe('buildSeoHead', () => {
  const canonicalUrl = `${ORIGIN}/photos/the-sea`

  it('emits canonical, Open Graph, and Twitter tags from one input', () => {
    const head = buildSeoHead({
      title: 'Where the Sea Keeps Going — FrameOS',
      description: '  The horizon does most of the work.  ',
      canonicalUrl,
      type: 'article',
      image: getPhotoShareImage(photo('the-sea'), ORIGIN),
    })

    expect(head.links).toEqual([{ rel: 'canonical', href: canonicalUrl }])
    expect(head.meta[0]).toEqual({ title: 'Where the Sea Keeps Going — FrameOS' })
    expect(metaContent(head, 'description')).toBe('The horizon does most of the work.')
    expect(metaContent(head, 'og:type')).toBe('article')
    expect(metaContent(head, 'og:site_name')).toBe('FrameOS')
    expect(metaContent(head, 'og:url')).toBe(canonicalUrl)
    expect(metaContent(head, 'og:image')).toBe(`${ORIGIN}/photos/the-sea/w1440.webp`)
    expect(metaContent(head, 'og:image:width')).toBe('1440')
    expect(metaContent(head, 'twitter:card')).toBe('summary_large_image')
    expect(metaContent(head, 'twitter:image')).toBe(`${ORIGIN}/photos/the-sea/w1440.webp`)
    expect(metaContent(head, 'robots')).toBeUndefined()
  })

  it('falls back to the default card on the canonical origin', () => {
    const head = buildSeoHead({ title: 'Signal', description: 'Hi', canonicalUrl: `${ORIGIN}/x` })

    expect(metaContent(head, 'og:image')).toBe(`${ORIGIN}${DEFAULT_SHARE_IMAGE.path}`)
    expect(metaContent(head, 'og:image:height')).toBe('630')
    expect(metaContent(head, 'og:type')).toBe('website')
  })

  it('passes robots and JSON-LD through', () => {
    const head = buildSeoHead({
      title: 't',
      description: 'd',
      canonicalUrl,
      robots: 'noindex,follow',
      jsonLd: [{ '@type': 'Thing' }],
    })

    expect(metaContent(head, 'robots')).toBe('noindex,follow')
    expect(head.meta).toContainEqual({ 'script:ld+json': { '@type': 'Thing' } })
  })
})

describe('structured data', () => {
  it('describes a photo as a Photograph with its full-size ImageObject', () => {
    const data = photographJsonLd({
      canonicalUrl: `${ORIGIN}/photos/the-sea`,
      photo: photo('the-sea'),
      world: { slug: 'wander', name: 'Wander' },
    })

    expect(data).toMatchObject({
      '@type': 'Photograph',
      url: `${ORIGIN}/photos/the-sea`,
      name: 'Where the Sea Keeps Going',
      image: {
        '@type': 'ImageObject',
        contentUrl: `${ORIGIN}/photos/the-sea/w2048.webp`,
        width: 2048,
        height: 1153,
      },
      isPartOf: { '@type': 'CollectionPage', '@id': `${ORIGIN}/worlds/wander` },
    })
  })

  it('lists collection photos in order', () => {
    const data = collectionPageJsonLd({
      canonicalUrl: `${ORIGIN}/worlds/wander`,
      name: 'Wander',
      description: 'd',
      photos: [photo('the-sea'), photo('the-waterfall')],
    }) as { mainEntity: { numberOfItems: number; itemListElement: Array<{ url: string }> } }

    expect(data.mainEntity.numberOfItems).toBe(2)
    expect(data.mainEntity.itemListElement[1].url).toBe(`${ORIGIN}/photos/the-waterfall`)
  })
})
