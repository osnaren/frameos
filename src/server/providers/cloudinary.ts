import { v2 as cloudinary } from 'cloudinary'

import { decodePhotoSlug, createPhotoSlug } from '@/lib/photo-slug'
import { getServerEnv, hasCloudinaryConfig } from '@/server/env'
import { captureException, emitAlert } from '@/server/observability/error-tracker'
import { recordMetric } from '@/server/observability/logger'
import { fixturePhotos } from '@/server/providers/mock-data'

import type { CloudinaryProvider } from '@/server/contracts'
import type { Photo, PhotoFilters, PhotoStatus } from '@/types/photo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CloudinaryAsset = Record<string, any>

const PAGE_FETCH_SIZE = 100
const MAX_ASSETS_TO_SCAN = 500
const WEBHOOK_MAX_AGE_SECONDS = 60 * 5

let isConfigured = false

function ensureConfigured() {
  if (isConfigured || !hasCloudinaryConfig()) {
    return
  }

  const env = getServerEnv()

  cloudinary.config({
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    secure: true,
  })

  isConfigured = true
}

/**
 * Without Cloudinary credentials the provider serves the bundled curated
 * launch archive (real photos, local delivery) in any environment. Once
 * credentials exist, Cloudinary becomes canonical again.
 */
function isLocalArchiveMode() {
  return !hasCloudinaryConfig()
}

function toStatus(value: unknown): PhotoStatus {
  return value === 'published' || value === 'archived' ? value : 'draft'
}

function firstDefinedString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return undefined
}

function toNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN

  return Number.isFinite(parsed) ? parsed : fallback
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

  return left.publicId.localeCompare(right.publicId)
}

function encodeCursor(photo: Photo) {
  return Buffer.from(
    JSON.stringify({
      sortOrder: photo.sortOrder,
      captureDate: photo.captureDate ?? photo.metadata.createdAt,
      publicId: photo.publicId,
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
      publicId: string
    }

    if (!parsed.publicId || typeof parsed.captureDate !== 'string') {
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

function normalizePhotoAsset(rawAsset: CloudinaryAsset): Photo {
  const context = rawAsset.context?.custom ?? {}
  const metadata = rawAsset.metadata ?? {}
  const imageMetadata = rawAsset.image_metadata ?? {}
  const exif = rawAsset.media_metadata?.image_metadata ?? {}

  const publicId = String(rawAsset.public_id ?? '')
  const captureDate =
    firstDefinedString(
      metadata.captureDate,
      context.captureDate,
      imageMetadata.DateTimeOriginal,
      exif.DateTimeOriginal
    ) ?? rawAsset.created_at

  return {
    publicId,
    slug: createPhotoSlug(publicId),
    status: toStatus(metadata.status ?? context.status),
    title:
      firstDefinedString(
        metadata.title,
        context.title,
        rawAsset.display_name,
        publicId.split('/').at(-1)
      ) ?? 'Untitled frame',
    alt: firstDefinedString(metadata.alt, context.alt) ?? '',
    caption: firstDefinedString(metadata.caption, context.caption),
    category: firstDefinedString(metadata.category, context.category),
    series: firstDefinedString(metadata.series, context.series),
    locationLabel: firstDefinedString(metadata.locationLabel, context.locationLabel),
    captureDate,
    sortOrder: toNumber(metadata.sortOrder ?? context.sortOrder, 0),
    metadataVersion: 'v1',
    tags: Array.isArray(rawAsset.tags)
      ? rawAsset.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : [],
    metadata: {
      width: toNumber(rawAsset.width),
      height: toNumber(rawAsset.height),
      format: String(rawAsset.format ?? 'jpg'),
      bytes: toNumber(rawAsset.bytes),
      createdAt: String(rawAsset.created_at ?? new Date().toISOString()),
      updatedAt: firstDefinedString(rawAsset.updated_at),
      camera: firstDefinedString(
        imageMetadata.Model,
        exif.Model,
        imageMetadata.CameraModelName,
        exif.CameraModelName
      ),
      lens: firstDefinedString(imageMetadata.LensModel, exif.LensModel),
      iso: firstDefinedString(imageMetadata.ISO, exif.ISO),
      shutterSpeed: firstDefinedString(
        imageMetadata.ExposureTime,
        exif.ExposureTime,
        imageMetadata.ShutterSpeedValue,
        exif.ShutterSpeedValue
      ),
      aperture: firstDefinedString(imageMetadata.FNumber, exif.FNumber),
      gps: firstDefinedString(imageMetadata.GPSLatitude, exif.GPSLatitude),
      palette: Array.isArray(rawAsset.colors)
        ? rawAsset.colors
            .map((entry: unknown) => (Array.isArray(entry) ? entry[0] : undefined))
            .filter((value: unknown): value is string => typeof value === 'string')
        : undefined,
    },
  }
}

function getBaseExpression() {
  const env = getServerEnv()
  const folder = env.CLOUDINARY_FOLDER?.trim()

  if (!folder) {
    return 'resource_type:image'
  }

  return `resource_type:image AND (folder="${folder}" OR asset_folder="${folder}")`
}

async function executeSearch(expression: string) {
  const resources: CloudinaryAsset[] = []
  let nextCursor: string | undefined

  do {
    const search = cloudinary.search
      .expression(expression)
      .max_results(PAGE_FETCH_SIZE)
      .sort_by('uploaded_at', 'desc')
      .with_field(['context', 'metadata', 'tags', 'image_metadata', 'media_metadata', 'colors'])

    if (nextCursor) {
      search.next_cursor(nextCursor)
    }

    const response = await search.execute()
    const page = Array.isArray(response.resources) ? response.resources : []

    resources.push(...page)
    nextCursor = response.next_cursor

    if (resources.length >= MAX_ASSETS_TO_SCAN) {
      break
    }
  } while (nextCursor)

  return resources.slice(0, MAX_ASSETS_TO_SCAN)
}

async function getAllPhotos() {
  if (isLocalArchiveMode()) {
    return fixturePhotos
  }

  ensureConfigured()
  const startedAt = Date.now()
  const expression = getBaseExpression()

  try {
    const assets = await executeSearch(expression)
    const photos = assets.map((asset) => normalizePhotoAsset(asset)).sort(comparePhotos)

    recordMetric('provider.cloudinary.latency_ms', Date.now() - startedAt, {
      provider: 'cloudinary',
      outcome: 'success',
    })

    return photos
  } catch (error) {
    captureException(error, {
      provider: 'cloudinary',
      eventType: 'search',
      outcome: 'failure',
    })
    emitAlert('cloudinary.read.failed', {
      provider: 'cloudinary',
      expression,
    })
    throw error
  }
}

function paginatePhotos(photos: Photo[], filters: PhotoFilters) {
  const filtered = photos.filter((photo) => matchesFilters(photo, filters))
  const cursor = decodeCursor(filters.after)
  const startIndex = cursor
    ? filtered.findIndex(
        (photo) =>
          photo.publicId === cursor.publicId &&
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

export function createCloudinaryProvider(): CloudinaryProvider {
  return {
    async searchPhotos(filters) {
      const photos = await getAllPhotos()
      return paginatePhotos(photos, filters)
    },
    async getPhotoByPublicId(publicId) {
      if (!publicId) {
        return null
      }

      if (isLocalArchiveMode()) {
        return fixturePhotos.find((photo) => photo.publicId === publicId) ?? null
      }

      ensureConfigured()
      const startedAt = Date.now()

      try {
        const asset = await cloudinary.api.resource(publicId, {
          colors: true,
          context: true,
          metadata: true,
          tags: true,
          image_metadata: true,
          media_metadata: true,
        })

        recordMetric('provider.cloudinary.latency_ms', Date.now() - startedAt, {
          provider: 'cloudinary',
          eventType: 'getPhotoByPublicId',
          outcome: 'success',
        })

        return normalizePhotoAsset(asset)
      } catch (error) {
        captureException(error, {
          provider: 'cloudinary',
          publicId,
          eventType: 'getPhotoByPublicId',
          outcome: 'failure',
        })
        return null
      }
    },
    async getPhotoBySlug(slug) {
      const decoded = decodePhotoSlug(slug)

      if (decoded) {
        return this.getPhotoByPublicId(decoded)
      }

      const photos = await getAllPhotos()
      return photos.find((photo) => photo.slug === slug) ?? null
    },
    async listChangedPhotos(sinceIso) {
      const photos = await getAllPhotos()

      return photos.filter((photo) => {
        const updatedAt = photo.metadata.updatedAt ?? photo.metadata.createdAt
        return updatedAt > sinceIso
      })
    },
    async verifyWebhook(request, bodyText) {
      if (!hasCloudinaryConfig()) {
        return {
          ok: false,
          reason: 'Missing Cloudinary configuration.',
        }
      }

      ensureConfigured()

      const signature = request.headers.get('x-cld-signature')
      const timestampHeader = request.headers.get('x-cld-timestamp')

      if (!signature || !timestampHeader) {
        return {
          ok: false,
          reason: 'Missing Cloudinary notification headers.',
        }
      }

      const timestamp = Number.parseInt(timestampHeader, 10)
      const timestampAgeSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp)

      if (
        !Number.isFinite(timestamp) ||
        timestampAgeSeconds > WEBHOOK_MAX_AGE_SECONDS ||
        !cloudinary.utils.verifyNotificationSignature(bodyText, timestamp, signature)
      ) {
        return {
          ok: false,
          reason:
            timestampAgeSeconds > WEBHOOK_MAX_AGE_SECONDS
              ? 'Stale Cloudinary notification timestamp.'
              : 'Invalid Cloudinary notification signature.',
        }
      }

      const payload = JSON.parse(bodyText) as Record<string, unknown>

      return {
        ok: true,
        fingerprint: `${payload.notification_type ?? 'notification'}:${payload.public_id ?? payload.asset_id ?? 'unknown'}:${timestampHeader}`,
        eventType: String(payload.notification_type ?? payload.action ?? 'notification'),
        publicId: typeof payload.public_id === 'string' ? payload.public_id : undefined,
        timestamp: new Date(timestamp * 1000).toISOString(),
      }
    },
    normalizeAsset(rawAsset) {
      return normalizePhotoAsset(rawAsset as CloudinaryAsset)
    },
  }
}
