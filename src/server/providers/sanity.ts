import { createClient } from '@sanity/client'
import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'

import { getServerEnv, hasSanityConfig } from '@/server/env'
import { captureException, emitAlert } from '@/server/observability/error-tracker'
import { logWarn, recordMetric } from '@/server/observability/logger'
import {
  fixtureAboutPage,
  fixtureContactPage,
  fixtureHomePage,
  fixturePhotos,
  fixtureSiteSettings,
} from '@/server/providers/mock-data'

import type { SanityDocumentId, SanityProvider } from '@/server/contracts'
import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  PhotoRef,
  SiteSettings,
} from '@/types/content'
import type { Photo, PhotoFilters, PhotoStatus } from '@/types/photo'

/** Bounds how often a warm lambda instance re-hits Sanity's API for the full photo list. */
const PHOTO_CACHE_TTL_MS = 30_000

type SanitySeo = {
  title?: string
  description?: string
  imagePublicId?: string
}

type SanityPageBase = {
  seo?: SanitySeo
}

type SanityPhotoRefValue = {
  slug?: string
}

type SanityHomeDocument = SanityPageBase & {
  eyebrow?: string
  headline?: string
  intro?: string
  cta?: {
    label?: string
    href?: string
  }
  featuredPhotos?: SanityPhotoRefValue[]
}

type SanityAboutDocument = SanityPageBase & {
  headline?: string
  body?: string[]
  photoHighlights?: SanityPhotoRefValue[]
}

type SanityContactDocument = SanityPageBase & {
  headline?: string
  body?: string[]
  email?: string
  socials?: Array<{ label?: string; href?: string }>
}

type SanityPaletteSwatch = {
  background?: string
}

type SanityRawImage = {
  url?: string
  width?: number
  height?: number
  format?: string
  bytes?: number
  lqip?: string
  palette?: Record<string, SanityPaletteSwatch | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exif?: Record<string, any>
  location?: { lat?: number; lng?: number }
  hotspot?: { x?: number; y?: number }
}

type SanityRawPhoto = {
  id?: string
  slug?: string
  archived?: boolean
  title?: string
  alt?: string
  description?: string
  caption?: string
  category?: string
  series?: string
  locationLabel?: string
  captureDate?: string
  sortOrder?: number
  tags?: string[]
  camera?: string
  lens?: string
  focalLength?: string
  iso?: string
  shutterSpeed?: string
  aperture?: string
  image?: SanityRawImage
  _updatedAt?: string
}

let sanityClient: ReturnType<typeof createClient> | null = null
let allPhotosCache: { photos: Photo[]; expiresAt: number } | null = null

/** Call after any webhook/reconcile write so the next read can't serve a pre-change snapshot. */
export function invalidateAllPhotosCache() {
  allPhotosCache = null
}

function getSanityClient() {
  if (!hasSanityConfig()) {
    return null
  }

  if (sanityClient) {
    return sanityClient
  }

  const env = getServerEnv()

  sanityClient = createClient({
    apiVersion: env.SANITY_API_VERSION,
    dataset: env.SANITY_DATASET!,
    projectId: env.SANITY_PROJECT_ID!,
    token: env.SANITY_API_TOKEN,
    perspective: 'published',
    useCdn: false,
  })

  return sanityClient
}

/** Without Sanity credentials the provider serves bundled editorial copy + photos in any environment. */
function isLocalArchiveMode() {
  return !hasSanityConfig()
}

function mapPhotoRefs(values: SanityPhotoRefValue[] | undefined): PhotoRef[] {
  return (values ?? [])
    .map((value) => value.slug)
    .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
    .map((slug) => ({ slug }))
}

function normalizeSeo(
  input: SanitySeo | undefined,
  fallbackTitle: string,
  fallbackDescription: string
) {
  return {
    title: input?.title?.trim() || fallbackTitle,
    description: input?.description?.trim() || fallbackDescription,
    imagePublicId: input?.imagePublicId?.trim(),
  }
}

function firstDefined<T>(...values: Array<T | undefined | null>) {
  for (const value of values) {
    if (typeof value === 'string' ? value.trim().length > 0 : value != null) {
      return value as T
    }
  }
  return undefined
}

/**
 * Sanity's exif field names aren't 100% pinned down without a live project to
 * inspect — this tries the common EXIF tag spellings defensively, the same
 * way the old Cloudinary normalizer tried multiple key variants. Verify
 * against a real uploaded photo once live credentials exist.
 */
function extractExifFields(exif: SanityRawImage['exif']) {
  if (!exif) {
    return {}
  }

  return {
    camera: firstDefined<string>(exif.Model, [exif.Make, exif.Model].filter(Boolean).join(' ')),
    lens: firstDefined<string>(exif.LensModel, exif.Lens),
    focalLength: firstDefined<number | string>(exif.FocalLength),
    iso: firstDefined<number | string>(
      exif.ISO,
      exif.ISOSpeedRatings,
      exif.PhotographicSensitivity
    ),
    shutterSpeed: firstDefined<number | string>(exif.ExposureTime, exif.ShutterSpeedValue),
    aperture: firstDefined<number | string>(exif.FNumber, exif.ApertureValue),
  }
}

function formatFocalLength(value: unknown) {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(num) ? `${Math.round(num)}mm` : undefined
}

function formatAperture(value: unknown) {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(num) ? `f/${Math.round(num * 10) / 10}` : undefined
}

function formatShutterSpeed(value: unknown) {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  if (!Number.isFinite(num) || num <= 0) {
    return undefined
  }
  return num >= 1 ? `${Math.round(num * 10) / 10}s` : `1/${Math.round(1 / num)}s`
}

function formatIso(value: unknown) {
  const num = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(num) ? String(num) : undefined
}

function formatGps(location: SanityRawImage['location']) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return undefined
  }
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
}

function extractPalette(palette: SanityRawImage['palette']) {
  if (!palette) {
    return undefined
  }

  const swatches = ['dominant', 'vibrant', 'darkMuted', 'muted', 'lightVibrant']
  const colors = swatches
    .map((name) => palette[name]?.background)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)

  return colors.length > 0 ? colors : undefined
}

function toStatus(archived: boolean | undefined): PhotoStatus {
  return archived ? 'archived' : 'published'
}

function normalizeSanityPhoto(raw: SanityRawPhoto): Photo | null {
  if (!raw.id || !raw.slug || !raw.image?.url) {
    return null
  }

  const exif = extractExifFields(raw.image.exif)
  const camera = firstDefined<string>(raw.camera, exif.camera)
  const lens = firstDefined<string>(raw.lens, exif.lens)
  const focalLength = firstDefined<string>(raw.focalLength, formatFocalLength(exif.focalLength))
  const iso = firstDefined<string>(raw.iso, formatIso(exif.iso))
  const shutterSpeed = firstDefined<string>(raw.shutterSpeed, formatShutterSpeed(exif.shutterSpeed))
  const aperture = firstDefined<string>(raw.aperture, formatAperture(exif.aperture))

  return {
    publicId: raw.image.url,
    slug: raw.slug,
    status: toStatus(raw.archived),
    title: raw.title?.trim() || 'Untitled frame',
    alt: raw.alt?.trim() || '',
    description: raw.description?.trim() || undefined,
    caption: raw.caption?.trim() || undefined,
    category: raw.category,
    series: raw.series,
    locationLabel: raw.locationLabel,
    captureDate: raw.captureDate,
    sortOrder: raw.sortOrder ?? 0,
    metadataVersion: 'v2',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    metadata: {
      width: raw.image.width ?? 0,
      height: raw.image.height ?? 0,
      format: raw.image.format ?? 'jpg',
      bytes: raw.image.bytes ?? 0,
      createdAt: raw._updatedAt ?? new Date().toISOString(),
      updatedAt: raw._updatedAt,
      camera,
      lens,
      focalLength,
      iso,
      shutterSpeed,
      aperture,
      gps: formatGps(raw.image.location),
      palette: extractPalette(raw.image.palette),
    },
    image: {
      lqip: raw.image.lqip,
      hotspot:
        raw.image.hotspot &&
        typeof raw.image.hotspot.x === 'number' &&
        typeof raw.image.hotspot.y === 'number'
          ? { x: raw.image.hotspot.x, y: raw.image.hotspot.y }
          : undefined,
    },
  }
}

function comparePhotos(left: Photo, right: Photo) {
  if (left.sortOrder !== right.sortOrder) {
    return right.sortOrder - left.sortOrder
  }

  const leftDate = left.captureDate ?? left.metadata.createdAt
  const rightDate = right.captureDate ?? right.metadata.createdAt

  if (leftDate !== rightDate) {
    return rightDate.localeCompare(leftDate)
  }

  return left.slug.localeCompare(right.slug)
}

function encodeCursor(photo: Photo) {
  return Buffer.from(
    JSON.stringify({
      sortOrder: photo.sortOrder,
      captureDate: photo.captureDate ?? photo.metadata.createdAt,
      slug: photo.slug,
    }),
    'utf8'
  ).toString('base64url')
}

function decodeCursor(cursor?: string) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      sortOrder: number
      captureDate: string
      slug: string
    }

    if (!parsed.slug || typeof parsed.captureDate !== 'string') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function matchesFilters(photo: Photo, filters: PhotoFilters) {
  if (filters.category && photo.category !== filters.category) {
    return false
  }

  if (filters.series && photo.series !== filters.series) {
    return false
  }

  if (filters.tag && !photo.tags.includes(filters.tag)) {
    return false
  }

  return true
}

function paginatePhotos(photos: Photo[], filters: PhotoFilters) {
  const filtered = photos.filter((photo) => matchesFilters(photo, filters))
  const cursor = decodeCursor(filters.after)
  const startIndex = cursor
    ? filtered.findIndex(
        (photo) =>
          photo.slug === cursor.slug &&
          (photo.captureDate ?? photo.metadata.createdAt) === cursor.captureDate &&
          photo.sortOrder === cursor.sortOrder
      ) + 1
    : 0

  const offset = Math.max(startIndex, 0)
  const limit = filters.limit ?? 24
  const items = filtered.slice(offset, offset + limit)

  return {
    photos: items,
    nextCursor:
      filtered.length > offset + limit && items.length > 0
        ? encodeCursor(items.at(-1)!)
        : undefined,
  }
}

const photoFieldsProjection = `
  "id": _id,
  "slug": slug.current,
  archived,
  title,
  alt,
  description,
  caption,
  "category": world,
  series,
  locationLabel,
  captureDate,
  sortOrder,
  tags,
  camera,
  lens,
  focalLength,
  iso,
  shutterSpeed,
  aperture,
  "image": image{
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height,
    "format": asset->extension,
    "bytes": asset->size,
    "lqip": asset->metadata.lqip,
    "palette": asset->metadata.palette,
    "exif": asset->metadata.exif,
    "location": asset->metadata.location,
    hotspot
  },
  _updatedAt
`

const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  brandMark,
  title,
  description,
  location,
  email,
  socials[]{
    label,
    href
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const homePageQuery = `*[_type == "homePage"][0]{
  eyebrow,
  headline,
  intro,
  cta{
    label,
    href
  },
  featuredPhotos[]->{
    "slug": slug.current
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const aboutPageQuery = `*[_type == "aboutPage"][0]{
  headline,
  body,
  photoHighlights[]->{
    "slug": slug.current
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const contactPageQuery = `*[_type == "contactPage"][0]{
  headline,
  body,
  email,
  socials[]{
    label,
    href
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const allPhotosQuery = `*[_type == "photo"]{${photoFieldsProjection}}`
const photoBySlugQuery = `*[_type == "photo" && slug.current == $slug][0]{${photoFieldsProjection}}`

async function fetchSanityDocument<T>(query: string, params?: Record<string, unknown>) {
  if (isLocalArchiveMode()) {
    return null as T | null
  }

  const client = getSanityClient()

  if (!client) {
    throw new Error('Sanity configuration is missing.')
  }

  const startedAt = Date.now()

  try {
    const result = await client.fetch<T>(query, params ?? {})
    recordMetric('provider.sanity.latency_ms', Date.now() - startedAt, {
      provider: 'sanity',
      outcome: 'success',
    })
    return result
  } catch (error) {
    captureException(error, {
      provider: 'sanity',
      outcome: 'failure',
    })
    emitAlert('sanity.read.failed', {
      provider: 'sanity',
      query,
    })
    throw error
  }
}

async function getAllPhotos(): Promise<Photo[]> {
  if (isLocalArchiveMode()) {
    return fixturePhotos
  }

  if (allPhotosCache && allPhotosCache.expiresAt > Date.now()) {
    return allPhotosCache.photos
  }

  const rows = await fetchSanityDocument<SanityRawPhoto[]>(allPhotosQuery)
  const photos = (rows ?? [])
    .map((row) => normalizeSanityPhoto(row))
    .filter((photo): photo is Photo => Boolean(photo))
    .sort(comparePhotos)

  allPhotosCache = { photos, expiresAt: Date.now() + PHOTO_CACHE_TTL_MS }
  return photos
}

export function createSanityProvider(): SanityProvider {
  return {
    async getSiteSettings() {
      if (isLocalArchiveMode()) {
        return fixtureSiteSettings
      }

      const document = await fetchSanityDocument<SiteSettings>(siteSettingsQuery)

      if (!document) {
        return null
      }

      return {
        brandMark: document.brandMark,
        title: document.title,
        description: document.description,
        location: document.location,
        email: document.email,
        socials: document.socials,
        seo: normalizeSeo(document.seo, document.title, document.description),
      }
    },
    async getHomePage() {
      if (isLocalArchiveMode()) {
        return fixtureHomePage
      }

      const document = await fetchSanityDocument<SanityHomeDocument>(homePageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'Home'
      const fallbackDescription = document.intro?.trim() || 'Photography portfolio home page.'

      return {
        eyebrow: document.eyebrow?.trim() || 'Photography portfolio',
        headline: fallbackTitle,
        intro: fallbackDescription,
        featuredPhotos: mapPhotoRefs(document.featuredPhotos),
        cta:
          document.cta && document.cta.label && document.cta.href
            ? {
                label: document.cta.label,
                href: document.cta.href,
              }
            : undefined,
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies HomePageContent
    },
    async getAboutPage() {
      if (isLocalArchiveMode()) {
        return fixtureAboutPage
      }

      const document = await fetchSanityDocument<SanityAboutDocument>(aboutPageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'About'
      const fallbackDescription = document.body?.[0]?.trim() || 'About page.'

      return {
        headline: fallbackTitle,
        body: (document.body ?? []).filter((value): value is string => typeof value === 'string'),
        photoHighlights: mapPhotoRefs(document.photoHighlights),
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies AboutPageContent
    },
    async getContactPage() {
      if (isLocalArchiveMode()) {
        return fixtureContactPage
      }

      const document = await fetchSanityDocument<SanityContactDocument>(contactPageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'Contact'
      const fallbackDescription = document.body?.[0]?.trim() || 'Contact page.'

      return {
        headline: fallbackTitle,
        body: (document.body ?? []).filter((value): value is string => typeof value === 'string'),
        email: document.email?.trim(),
        socials:
          document.socials
            ?.filter((item): item is { label: string; href: string } =>
              Boolean(item.label && item.href)
            )
            .map((item) => ({
              label: item.label,
              href: item.href,
            })) ?? [],
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies ContactPageContent
    },
    async searchPhotos(filters) {
      const photos = await getAllPhotos()
      return paginatePhotos(photos, filters)
    },
    async getPhotoBySlug(slug) {
      if (isLocalArchiveMode()) {
        const photos = await getAllPhotos()
        return photos.find((photo) => photo.slug === slug) ?? null
      }

      const raw = await fetchSanityDocument<SanityRawPhoto | null>(photoBySlugQuery, { slug })
      return raw ? normalizeSanityPhoto(raw) : null
    },
    async listChangedPhotos(sinceIso) {
      const photos = await getAllPhotos()

      return photos.filter((photo) => {
        const updatedAt = photo.metadata.updatedAt ?? photo.metadata.createdAt
        return updatedAt > sinceIso
      })
    },
    async listChangedDocuments(sinceIso) {
      if (isLocalArchiveMode()) {
        return ['siteSettings', 'homePage', 'aboutPage', 'contactPage']
      }

      const client = getSanityClient()

      if (!client) {
        return []
      }

      const rows = await client.fetch<Array<{ _type: SanityDocumentId }>>(
        `*[_type in ["siteSettings", "homePage", "aboutPage", "contactPage", "photo"] && _updatedAt > $since]{
          _type
        }`,
        { since: sinceIso }
      )

      return Array.from(new Set(rows.map((row) => row._type)))
    },
    async verifyWebhook(request, bodyText) {
      const env = getServerEnv()
      const secret = env.SANITY_WEBHOOK_SECRET

      if (!secret) {
        return {
          ok: false,
          reason: 'Missing Sanity webhook secret.',
        }
      }

      const signature =
        request.headers.get(SIGNATURE_HEADER_NAME) ?? request.headers.get('x-sanity-signature')

      if (!signature) {
        return {
          ok: false,
          reason: 'Missing Sanity signature header.',
        }
      }

      const valid = await isValidSignature(bodyText, signature, secret)

      if (!valid) {
        return {
          ok: false,
          reason: 'Invalid Sanity webhook signature.',
        }
      }

      const payload = JSON.parse(bodyText) as Record<string, unknown>
      const documentType =
        payload._type ?? payload.documentType ?? payload.documentId ?? payload.type

      const documentId =
        documentType === 'siteSettings' ||
        documentType === 'homePage' ||
        documentType === 'aboutPage' ||
        documentType === 'contactPage' ||
        documentType === 'photo'
          ? documentType
          : undefined

      if (!documentId) {
        logWarn('sanity.webhook.unknown-document', { payload })
      }

      return {
        ok: true,
        documentId,
        idempotencyKey:
          request.headers.get('idempotency-key') ??
          request.headers.get('Idempotency-Key') ??
          undefined,
        updatedAt:
          typeof payload._updatedAt === 'string' ? payload._updatedAt : new Date().toISOString(),
      }
    },
  }
}
