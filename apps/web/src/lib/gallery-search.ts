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

export function buildCanonicalArchiveSearch(search: Pick<GallerySearchState, 'category'>) {
  const params = new URLSearchParams()

  if (search.category) {
    params.set('world', search.category)
  }

  return params.toString()
}

/* ---- The Index: client-side filters over the complete published archive ---- */

/** The Index's public URL filters (`/archive?world=…&tag=…&series=…`). */
export interface ArchiveFilters {
  world?: string
  tag?: string
  series?: string
}

export const ARCHIVE_FILTER_KEYS = ['world', 'tag', 'series'] as const

interface FilterablePhoto {
  slug: string
  category?: string
  series?: string
  tags: readonly string[]
}

/**
 * Same matching rules as the provider's server-side search (`matchesFilters`
 * in providers/sanity.ts): exact world slug, exact series, exact tag.
 */
export function matchesArchiveFilters(photo: FilterablePhoto, filters: ArchiveFilters) {
  if (filters.world && photo.category !== filters.world) {
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

export function filterArchiveItems<T extends { photo: FilterablePhoto }>(
  items: readonly T[],
  filters: ArchiveFilters
): T[] {
  return items.filter((item) => matchesArchiveFilters(item.photo, filters))
}

/**
 * Fail-closed visibility: a photo assigned to a world that isn't public
 * (hidden, like People, or unknown) never appears on a public surface, even
 * if the photo document itself is published. Unassigned photos are fine.
 */
export function isInPublicWorld(photo: { category?: string }, publicWorldSlugs: readonly string[]) {
  return !photo.category || publicWorldSlugs.includes(photo.category)
}

export function hasArchiveFilters(filters: ArchiveFilters) {
  return ARCHIVE_FILTER_KEYS.some((key) => Boolean(filters[key]))
}

/** Drops filters that point at nothing public (e.g. a hidden world), so they can't leak or confuse. */
export function sanitizeArchiveFilters(
  filters: ArchiveFilters,
  publicWorldSlugs: readonly string[]
): ArchiveFilters {
  return {
    world: filters.world && publicWorldSlugs.includes(filters.world) ? filters.world : undefined,
    tag: filters.tag || undefined,
    series: filters.series || undefined,
  }
}

export interface ArchiveFacet {
  value: string
  count: number
}

function countValues(values: Iterable<string>): ArchiveFacet[] {
  const counts = new Map<string, number>()

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (left, right) => right.count - left.count || left.value.localeCompare(right.value)
  )
}

/**
 * Counts for the Index's filter controls, always derived from the data so a
 * new photo, tag, world or series shows up without a code change. World
 * counts ignore the active world (so every world stays reachable); tag and
 * series counts respect the active world, so they describe what's actually
 * in view.
 */
export function summarizeArchiveFacets<T extends { photo: FilterablePhoto }>(
  items: readonly T[],
  filters: ArchiveFilters
) {
  const inWorld = filters.world ? filterArchiveItems(items, { world: filters.world }) : items

  return {
    total: items.length,
    worlds: countValues(
      items.map((item) => item.photo.category).filter((value): value is string => Boolean(value))
    ),
    tags: countValues(inWorld.flatMap((item) => item.photo.tags)),
    series: countValues(
      inWorld.map((item) => item.photo.series).filter((value): value is string => Boolean(value))
    ),
  }
}

/** Joins cursor pages into one list, dropping any photo a later page repeats. */
export function mergeFeedPages<T extends { photo: { slug: string } }>(
  pages: ReadonlyArray<readonly T[]>
): T[] {
  const seen = new Set<string>()
  const merged: T[] = []

  for (const page of pages) {
    for (const item of page) {
      if (!seen.has(item.photo.slug)) {
        seen.add(item.photo.slug)
        merged.push(item)
      }
    }
  }

  return merged
}
