/**
 * Page metadata: titles, descriptions, canonical links, Open Graph / Twitter
 * cards, and schema.org JSON-LD.
 *
 * Route `head()` functions run on the server and in the client entry chunk,
 * so this module stays pure and light: it must not import the photo manifest
 * (content/worlds.ts) or anything else heavy.
 */
import { buildSanityImageUrl, getImagePresetDefinition } from '@/lib/image-policy'

import type { ShareImage, SiteSettings, World } from '@/types/content'
import type { Photo } from '@/types/photo'

export const SITE_NAME = 'FrameOS'
export const SITE_LANGUAGE = 'en'

/**
 * The photographer behind the archive, for schema.org `Person` / `creator`.
 * The site itself doesn't print a name yet — change this if the archive
 * should be credited differently.
 */
export const SITE_AUTHOR_NAME = 'Obuli Sai Naren'

/** Browser-chrome colours: the page background of each theme (styles.css `--bg`). */
export const THEME_COLORS = { light: '#f8f5ee', dark: '#14120e' } as const

/** 1200×630 crop of the Wander hero, for pages without a photo of their own. */
export const DEFAULT_SHARE_IMAGE = {
  path: '/og-default.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'Waves breaking under a pale sky, the horizon stretching unbroken across the frame.',
} as const

/** Must match LOCAL_PUBLIC_ID_PREFIX in content/worlds.ts (duplicated to keep the manifest out of this module). */
export const LOCAL_PHOTO_PREFIX = 'local/'

/**
 * Local variants follow scripts/build-photo-assets.mjs: every standard width
 * below the original, plus min(original, 2048). So `min(original, 1440)` and
 * `min(original, 2048)` always exist on disk (guarded by tests/seo.test.ts).
 */
const LOCAL_SHARE_WIDTH = 1440
const LOCAL_FULL_WIDTH = 2048

export type JsonLd = Record<string, unknown>

function localPhotoUrl(id: string, width: number, origin: string) {
  return new URL(`/photos/${encodeURIComponent(id)}/w${width}.webp`, origin).toString()
}

function scaledHeight(width: number, original: { width: number; height: number }) {
  return Math.round((width * original.height) / original.width)
}

export function getDefaultShareImage(origin: string): ShareImage {
  return {
    url: new URL(DEFAULT_SHARE_IMAGE.path, origin).toString(),
    width: DEFAULT_SHARE_IMAGE.width,
    height: DEFAULT_SHARE_IMAGE.height,
    type: DEFAULT_SHARE_IMAGE.type,
    alt: DEFAULT_SHARE_IMAGE.alt,
  }
}

type ShareablePhoto = Pick<Photo, 'publicId' | 'alt' | 'title' | 'metadata' | 'image'>

/**
 * A card-sized rendition of a photo. Sanity photos get an exact 1200×630
 * hotspot-aware JPEG crop (JPEG for crawler compatibility); local fixture
 * photos use their 1440px WebP variant at its natural aspect ratio.
 */
export function getPhotoShareImage(photo: ShareablePhoto, origin: string): ShareImage | null {
  const alt = photo.alt.trim() || photo.title

  if (photo.publicId.startsWith(LOCAL_PHOTO_PREFIX)) {
    const id = photo.publicId.slice(LOCAL_PHOTO_PREFIX.length)
    const { width, height } = photo.metadata
    if (!id || !width || !height) {
      return null
    }

    const variant = Math.min(width, LOCAL_SHARE_WIDTH)
    return {
      url: localPhotoUrl(id, variant, origin),
      width: variant,
      height: scaledHeight(variant, { width, height }),
      type: 'image/webp',
      alt,
    }
  }

  if (/^https?:\/\//.test(photo.publicId)) {
    const og = getImagePresetDefinition('og')
    const url = new URL(
      buildSanityImageUrl({ baseUrl: photo.publicId, preset: 'og', hotspot: photo.image?.hotspot })
    )
    url.searchParams.delete('auto')
    url.searchParams.set('fm', 'jpg')
    return { url: url.toString(), width: og.width, height: og.height, type: 'image/jpeg', alt }
  }

  return null
}

/** The largest web rendition of a photo — for structured data and the image sitemap. */
export function getPhotoFullImage(
  photo: ShareablePhoto,
  origin: string
): { url: string; width?: number; height?: number } | null {
  const { width, height } = photo.metadata

  if (photo.publicId.startsWith(LOCAL_PHOTO_PREFIX)) {
    const id = photo.publicId.slice(LOCAL_PHOTO_PREFIX.length)
    if (!id || !width || !height) {
      return null
    }

    const variant = Math.min(width, LOCAL_FULL_WIDTH)
    return {
      url: localPhotoUrl(id, variant, origin),
      width: variant,
      height: scaledHeight(variant, { width, height }),
    }
  }

  if (/^https?:\/\//.test(photo.publicId)) {
    const detail = getImagePresetDefinition('detail')
    const rendered = width && height ? Math.min(width, detail.width) : undefined
    return {
      url: buildSanityImageUrl({ baseUrl: photo.publicId, preset: 'detail' }),
      width: rendered,
      height: rendered && width && height ? scaledHeight(rendered, { width, height }) : undefined,
    }
  }

  return null
}

export interface SeoHeadInput {
  title: string
  description: string
  canonicalUrl: string
  image?: ShareImage | null
  type?: 'website' | 'article'
  robots?: string
  jsonLd?: JsonLd[]
}

/**
 * Everything a route's `head()` returns for a content page. Every tag is
 * emitted on every page (never inherited from the root route), so an image
 * from one page can't leak its dimensions onto another.
 */
export function buildSeoHead(input: SeoHeadInput) {
  const origin = new URL(input.canonicalUrl).origin
  const image = input.image ?? getDefaultShareImage(origin)
  const description = input.description.trim()

  const meta: Array<Record<string, unknown>> = [
    { title: input.title },
    { name: 'description', content: description },
    ...(input.robots ? [{ name: 'robots', content: input.robots }] : []),
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: input.canonicalUrl },
    { property: 'og:image', content: image.url },
    ...(image.type ? [{ property: 'og:image:type', content: image.type }] : []),
    ...(image.width ? [{ property: 'og:image:width', content: String(image.width) }] : []),
    ...(image.height ? [{ property: 'og:image:height', content: String(image.height) }] : []),
    { property: 'og:image:alt', content: image.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image.url },
    { name: 'twitter:image:alt', content: image.alt },
    ...(input.jsonLd ?? []).map((data) => ({ 'script:ld+json': data })),
  ]

  return {
    meta,
    links: [{ rel: 'canonical', href: input.canonicalUrl }],
  }
}

function websiteRef(origin: string) {
  return { '@type': 'WebSite', '@id': `${origin}/#website`, name: SITE_NAME, url: `${origin}/` }
}

function personRef(origin: string) {
  return { '@type': 'Person', '@id': `${origin}/#person`, name: SITE_AUTHOR_NAME }
}

/** WebSite + Person graph for the home page. */
export function siteJsonLd(input: {
  origin: string
  site: Pick<SiteSettings, 'title' | 'description' | 'email' | 'socials'>
  description: string
}): JsonLd {
  const sameAs = input.site.socials
    .map((social) => social.href)
    .filter((href) => /^https?:\/\//.test(href))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...websiteRef(input.origin),
        alternateName: input.site.title,
        description: input.description,
        inLanguage: SITE_LANGUAGE,
        author: { '@id': `${input.origin}/#person` },
        publisher: { '@id': `${input.origin}/#person` },
      },
      {
        ...personRef(input.origin),
        url: `${input.origin}/notes`,
        ...(input.site.email ? { email: `mailto:${input.site.email}` } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
    ],
  }
}

/** CollectionPage + ItemList for the Index and each world. */
export function collectionPageJsonLd(input: {
  canonicalUrl: string
  name: string
  description: string
  image?: ShareImage | null
  photos: Array<Pick<Photo, 'slug' | 'title'>>
}): JsonLd {
  const origin = new URL(input.canonicalUrl).origin

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': input.canonicalUrl,
    url: input.canonicalUrl,
    name: input.name,
    description: input.description,
    inLanguage: SITE_LANGUAGE,
    isPartOf: websiteRef(origin),
    ...(input.image
      ? { primaryImageOfPage: { '@type': 'ImageObject', contentUrl: input.image.url } }
      : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.photos.length,
      itemListElement: input.photos.map((photo, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: new URL(`/photos/${encodeURIComponent(photo.slug)}`, origin).toString(),
        name: photo.title,
      })),
    },
  }
}

/** Photograph (with its ImageObject) for a photo detail page. */
export function photographJsonLd(input: {
  canonicalUrl: string
  photo: Pick<
    Photo,
    | 'publicId'
    | 'slug'
    | 'title'
    | 'alt'
    | 'caption'
    | 'description'
    | 'captureDate'
    | 'tags'
    | 'metadata'
    | 'image'
  >
  world?: Pick<World, 'slug' | 'name'>
}): JsonLd {
  const origin = new URL(input.canonicalUrl).origin
  const { photo } = input
  const image = getPhotoFullImage(photo, origin)
  const creator = personRef(origin)

  return {
    '@context': 'https://schema.org',
    '@type': 'Photograph',
    '@id': `${input.canonicalUrl}#photograph`,
    url: input.canonicalUrl,
    name: photo.title,
    description: photo.caption ?? photo.description ?? photo.alt,
    inLanguage: SITE_LANGUAGE,
    creator,
    ...(photo.captureDate ? { dateCreated: photo.captureDate } : {}),
    ...(photo.tags.length > 0 ? { keywords: photo.tags.join(', ') } : {}),
    ...(image
      ? {
          image: {
            '@type': 'ImageObject',
            contentUrl: image.url,
            url: image.url,
            ...(image.width ? { width: image.width } : {}),
            ...(image.height ? { height: image.height } : {}),
            caption: photo.alt,
            creator,
            creditText: SITE_AUTHOR_NAME,
          },
        }
      : {}),
    isPartOf: input.world
      ? {
          '@type': 'CollectionPage',
          '@id': new URL(`/worlds/${encodeURIComponent(input.world.slug)}`, origin).toString(),
          name: input.world.name,
        }
      : websiteRef(origin),
  }
}
