import type { PhotoFilters } from '@/types/photo'

export const DEFAULT_GALLERY_LIMIT = 24
export const MAX_GALLERY_LIMIT = 48

export interface GallerySearchState {
  category?: string
  series?: string
  tag?: string
  after?: string
  limit: number
}

function normalizeSearchValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined
  }

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function validateGallerySearch(search: Record<string, unknown>): GallerySearchState {
  const rawLimit = normalizeSearchValue(search.limit)
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : DEFAULT_GALLERY_LIMIT

  return {
    category: normalizeSearchValue(search.category),
    series: normalizeSearchValue(search.series),
    tag: normalizeSearchValue(search.tag),
    after: normalizeSearchValue(search.after),
    limit:
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MAX_GALLERY_LIMIT)
        : DEFAULT_GALLERY_LIMIT,
  }
}

export function toPhotoFilters(search: GallerySearchState): PhotoFilters {
  return search
}

export function buildCanonicalGallerySearch(search: GallerySearchState) {
  const params = new URLSearchParams()

  if (search.category) {
    params.set('category', search.category)
  }

  if (search.series) {
    params.set('series', search.series)
  }

  if (search.tag) {
    params.set('tag', search.tag)
  }

  if (search.after) {
    params.set('after', search.after)
  }

  return params.toString()
}
