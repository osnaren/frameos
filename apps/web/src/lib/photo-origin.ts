/**
 * Where a visitor opened a photograph from, so the photo page's back link,
 * Esc key, and breadcrumb return them there — the same Index filters (and,
 * via real history navigation, the same scroll position) or the same world.
 *
 * The origin rides along in the browser's history state, so it survives a
 * reload and carries through prev/next paging (which replaces the history
 * entry rather than stacking one per frame). A shared link or a fresh tab has
 * no origin; the photo's own world (or the Index) is the fallback.
 */
import { ARCHIVE_FILTER_KEYS, type ArchiveFilters } from '@/lib/gallery-search'

import type { HistoryState } from '@tanstack/react-router'

export type PhotoOrigin =
  | {
      kind: 'archive'
      filters: ArchiveFilters
      /** True when the history entry just before this photo IS the origin page. */
      viaHistory: boolean
    }
  | {
      kind: 'world'
      world: string
      viaHistory: boolean
    }

export const PHOTO_ORIGIN_STATE_KEY = 'photoOrigin'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readFilters(value: unknown): ArchiveFilters {
  const filters: ArchiveFilters = {}

  if (!isRecord(value)) {
    return filters
  }

  for (const key of ARCHIVE_FILTER_KEYS) {
    const entry = value[key]
    if (typeof entry === 'string' && entry.length > 0) {
      filters[key] = entry
    }
  }

  return filters
}

/** Parses the origin out of a location's history state; anything malformed reads as "unknown". */
export function readPhotoOrigin(state: unknown): PhotoOrigin | null {
  if (!isRecord(state)) {
    return null
  }

  const origin = state[PHOTO_ORIGIN_STATE_KEY]

  if (!isRecord(origin)) {
    return null
  }

  const viaHistory = origin.viaHistory === true

  if (origin.kind === 'archive') {
    return { kind: 'archive', filters: readFilters(origin.filters), viaHistory }
  }

  if (origin.kind === 'world' && typeof origin.world === 'string' && origin.world.length > 0) {
    return { kind: 'world', world: origin.world, viaHistory }
  }

  return null
}

/**
 * History state to attach to a link that opens a photograph. TanStack's
 * `HistoryState` is an open, app-extensible bag (its own keys are all
 * optional), so our key is typed into it here, once.
 */
export function photoOriginState(origin: PhotoOrigin): HistoryState {
  return { [PHOTO_ORIGIN_STATE_KEY]: origin } as unknown as HistoryState
}

/**
 * The same origin for a sideways move (prev/next, "more from this world")
 * that replaces the current history entry — the entry before it is still the
 * origin, so history-based return stays valid.
 */
export function carryPhotoOrigin(origin: PhotoOrigin | null): HistoryState {
  return origin ? photoOriginState(origin) : {}
}

/** Where to send a visitor who arrived without an origin: the photo's world, else the Index. */
export function fallbackPhotoOrigin(
  photoWorld: string | undefined,
  publicWorldSlugs: readonly string[]
): PhotoOrigin {
  return photoWorld && publicWorldSlugs.includes(photoWorld)
    ? { kind: 'world', world: photoWorld, viaHistory: false }
    : { kind: 'archive', filters: {}, viaHistory: false }
}

/** Human label for the return destination, e.g. "Wander", "Index", "Index · #rain". */
export function describePhotoOrigin(
  origin: PhotoOrigin,
  worldName: (slug: string) => string | undefined
): string {
  if (origin.kind === 'world') {
    return worldName(origin.world) ?? 'World'
  }

  const parts = [
    origin.filters.world ? worldName(origin.filters.world) : undefined,
    origin.filters.series,
    origin.filters.tag ? `#${origin.filters.tag}` : undefined,
  ].filter((part): part is string => Boolean(part))

  return parts.length > 0 ? `Index · ${parts.join(' · ')}` : 'Index'
}
