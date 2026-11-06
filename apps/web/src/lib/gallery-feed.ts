/**
 * The complete published feed for a filter, however many pages it spans.
 *
 * `getGalleryFeedServer` is cursor-paginated (at most MAX_GALLERY_LIMIT per
 * page). The Index, world pages, and photo prev/next all need the whole set —
 * an archive of 18 to a few hundred frames is small enough to hold at once,
 * and stopping at page one would silently drop everything after it and make
 * every count a lie. Pages are fetched in order until the cursor runs out.
 */
import { MAX_GALLERY_LIMIT, mergeFeedPages } from '@/lib/gallery-search'
import { getGalleryFeedServer } from '@/server/server-functions/portfolio'

import type { GalleryFeed } from '@/types/photo'

/** Hard stop so a misbehaving cursor can never loop forever (40 × 48 = 1,920 frames). */
const MAX_PAGES = 40

export interface CompleteFeedFilters {
  category?: string
  series?: string
  tag?: string
}

export async function loadCompleteGalleryFeed(
  filters: CompleteFeedFilters = {}
): Promise<GalleryFeed> {
  const first = await getGalleryFeedServer({ data: { ...filters, limit: MAX_GALLERY_LIMIT } })
  const pages = [first.items]
  let cursor = first.nextCursor
  let isDegraded = first.isDegraded
  let errorMessage = first.errorMessage

  for (let page = 1; cursor && page < MAX_PAGES; page++) {
    const next = await getGalleryFeedServer({
      data: { ...filters, after: cursor, limit: MAX_GALLERY_LIMIT },
    })

    pages.push(next.items)
    isDegraded ||= next.isDegraded
    errorMessage ??= next.errorMessage

    if (!next.nextCursor || next.nextCursor === cursor || next.items.length === 0) {
      cursor = undefined
      break
    }

    cursor = next.nextCursor
  }

  return {
    ...first,
    items: mergeFeedPages(pages),
    nextCursor: cursor,
    isDegraded,
    errorMessage,
  }
}
