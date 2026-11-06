import { useEffect, useMemo, useRef, useState } from 'react'

import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { z } from 'zod'

import { ArchiveLightbox } from '@/components/archive/ArchiveLightbox'
import { StatusBanner } from '@/components/content/StatusBanner'
import { ArchiveSkeleton } from '@/components/layout/RouteSkeletons'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { findSheetNeighbour, isSheetKey } from '@/lib/contact-sheet'
import { loadCompleteGalleryFeed } from '@/lib/gallery-feed'
import {
  buildCanonicalArchiveSearch,
  filterArchiveItems,
  hasArchiveFilters,
  isInPublicWorld,
  sanitizeArchiveFilters,
  summarizeArchiveFacets,
  type ArchiveFilters,
} from '@/lib/gallery-search'
import { contactSheetTileSizes } from '@/lib/image-policy'
import { useHydratedReducedMotion } from '@/lib/motion'
import { photoOriginState, type PhotoOrigin } from '@/lib/photo-origin'
import { buildSeoHead, collectionPageJsonLd, getPhotoShareImage } from '@/lib/seo'
import { getWorldsServer } from '@/server/server-functions/portfolio'

import type { World } from '@/types/content'

const slugParam = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/i)
  .optional()
  .catch(undefined)
const labelParam = z.string().trim().min(1).max(64).optional().catch(undefined)

const archiveSearchSchema = z.object({
  world: slugParam,
  tag: labelParam,
  series: labelParam,
  /** The frame open in the lightbox. */
  frame: slugParam,
})

export const Route = createFileRoute('/archive')({
  validateSearch: archiveSearchSchema,
  // The whole published archive loads once (every cursor page) and filters
  // client-side: switching worlds/tags is instant, counts are always the true
  // totals, and nothing past the first page can silently go missing.
  loader: async () => {
    const [worlds, feed] = await Promise.all([getWorldsServer(), loadCompleteGalleryFeed()])
    return { feed, worlds }
  },
  staleTime: 30_000,
  gcTime: 300_000,
  head: ({ loaderData, match }) => {
    if (!loaderData) {
      return {}
    }

    const { feed, worlds } = loaderData
    const world = worlds.find((entry) => entry.slug === match.search.world)
    const canonical = new URL(feed.canonicalUrl)
    canonical.search = buildCanonicalArchiveSearch({ category: world?.slug })
    const canonicalUrl = canonical.toString()
    const title = world
      ? `${world.name} \u00b7 Index \u2014 FrameOS Pocket Worlds`
      : 'Index \u2014 FrameOS Pocket Worlds'
    const description = world
      ? `Every published frame from ${world.name}, laid out as a contact sheet. ${world.line}`
      : 'The full FrameOS archive as a contact sheet: every published frame, photographed on a phone.'
    const photos = feed.items
      .map((item) => item.photo)
      .filter((photo) => !world || photo.category === world.slug)
    const image = photos.length > 0 ? getPhotoShareImage(photos[0], canonical.origin) : null

    return buildSeoHead({
      title,
      description,
      canonicalUrl,
      image,
      robots: feed.robots,
      jsonLd: [
        collectionPageJsonLd({
          canonicalUrl,
          name: title,
          description,
          image,
          photos,
        }),
      ],
    })
  },
  pendingComponent: ArchiveSkeleton,
  component: ArchiveRoute,
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many
}

/** Search for a filter link: keeps the other filters, closes any open frame. */
function withFilter(key: keyof ArchiveFilters, value: string | undefined) {
  return (previous: Record<string, unknown>) => ({ ...previous, [key]: value, frame: undefined })
}

/** Every filter explicitly cleared (explicit `undefined`s matter for active matching). */
const NO_FILTERS = { world: undefined, tag: undefined, series: undefined, frame: undefined }

/**
 * A filter link is "current" only on an exact search match: the router's
 * default partial match would mark "All" active whenever any tag is set.
 */
const FILTER_LINK_ACTIVE = { includeSearch: true, explicitUndefined: true } as const

/**
 * Floating badge: how far through the sheet you are. Driven by one
 * IntersectionObserver rather than measuring every tile on scroll, so it
 * stays cheap at hundreds of frames.
 */
function FrameCounter({
  total,
  sheetRef,
  resetKey,
}: {
  total: number
  sheetRef: React.RefObject<HTMLElement | null>
  resetKey: string
}) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) {
      setVisible(false)
      return
    }

    const passed = new Set<Element>()
    const tiles = sheet.querySelectorAll('[data-frame-index]')
    const tileObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const above = entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0)
          if (entry.isIntersecting || above) passed.add(entry.target)
          else passed.delete(entry.target)
        }
        setCurrent(passed.size)
      },
      // A frame counts once its top crosses 70% of the way down the viewport.
      { rootMargin: '0px 0px -30% 0px' }
    )
    const sheetObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))

    tiles.forEach((tile) => tileObserver.observe(tile))
    sheetObserver.observe(sheet)

    return () => {
      tileObserver.disconnect()
      sheetObserver.disconnect()
    }
  }, [sheetRef, resetKey, total])

  return (
    <div className={`frame-counter ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      <span className="frame-counter-dot" />
      <span>
        {pad(Math.min(current, total))} / {pad(total)}
      </span>
    </div>
  )
}

function describeFilters(filters: ArchiveFilters, world: World | null) {
  const parts = [
    filters.tag ? `tagged #${filters.tag}` : null,
    filters.series ? `in the series “${filters.series}”` : null,
    world ? `in ${world.name}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : 'in the archive'
}

/**
 * The Index: every published frame on one justified contact sheet, filterable
 * by world, tag and series — all in the URL, all shareable — with a darkroom
 * lightbox for close inspection.
 */
function ArchiveRoute() {
  const { feed, worlds } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/archive' })
  const router = useRouter()
  const reducedMotion = useHydratedReducedMotion()
  const sheetRef = useRef<HTMLUListElement>(null)
  /** Whether this page pushed the open frame onto history (so closing can go Back). */
  const [pushedFrame, setPushedFrame] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const worldSlugs = useMemo(() => worlds.map((world) => world.slug), [worlds])
  const publicItems = useMemo(
    () => feed.items.filter((item) => isInPublicWorld(item.photo, worldSlugs)),
    [feed.items, worldSlugs]
  )
  const filters = useMemo(
    () =>
      sanitizeArchiveFilters(
        { world: search.world, tag: search.tag, series: search.series },
        worldSlugs
      ),
    [search.world, search.tag, search.series, worldSlugs]
  )
  const items = useMemo(() => filterArchiveItems(publicItems, filters), [publicItems, filters])
  const facets = useMemo(() => summarizeArchiveFacets(publicItems, filters), [publicItems, filters])
  const activeWorld = filters.world
    ? (worlds.find((world) => world.slug === filters.world) ?? null)
    : null
  const isFiltered = hasArchiveFilters(filters)
  const sheetKey = [filters.world, filters.series, filters.tag].join('|')
  const tabbableSlug = items.some((item) => item.photo.slug === activeSlug)
    ? activeSlug
    : (items[0]?.photo.slug ?? null)

  /* ---- Lightbox: open state lives in `?frame=` ---- */
  const frameIndex = search.frame ? items.findIndex((item) => item.photo.slug === search.frame) : -1

  // Once the frame closes (by any route, Back included) there is nothing left to pop.
  const openedViaPush = pushedFrame && Boolean(search.frame)

  const openFrame = (slug: string) => {
    setPushedFrame(true)
    setActiveSlug(slug)
    void navigate({
      search: (previous) => ({ ...previous, frame: slug }),
      resetScroll: false,
      viewTransition: false,
    })
  }

  const pageFrame = (index: number) => {
    const slug = items[index]?.photo.slug
    if (!slug) return
    setActiveSlug(slug)
    void navigate({
      search: (previous) => ({ ...previous, frame: slug }),
      replace: true,
      resetScroll: false,
      viewTransition: false,
    })
  }

  const closeFrame = () => {
    if (openedViaPush) {
      setPushedFrame(false)
      router.history.back()
      return
    }

    void navigate({
      search: (previous) => ({ ...previous, frame: undefined }),
      replace: true,
      resetScroll: false,
      viewTransition: false,
    })
  }

  const restoreFocus = (slug: string) => {
    requestAnimationFrame(() => {
      const trigger = sheetRef.current?.querySelector<HTMLElement>(
        `[data-archive-trigger][data-slug="${CSS.escape(slug)}"]`
      )
      if (!trigger) return
      setActiveSlug(slug)
      trigger.focus({ preventScroll: true })
      trigger.scrollIntoView({ block: 'nearest' })
    })
  }

  const detailOrigin: PhotoOrigin = {
    kind: 'archive',
    filters,
    viaHistory: openedViaPush,
  }

  /* ---- Keyboard: roving focus across the justified rows ---- */
  const handleSheetKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (!isSheetKey(event.key) || event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    const triggers = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>('[data-archive-trigger]') ?? []
    )
    const current = triggers.indexOf(document.activeElement as HTMLElement)
    if (current === -1) {
      return
    }

    event.preventDefault()
    // `current` is a valid index, so the neighbour always is too.
    const next =
      triggers[
        findSheetNeighbour(
          triggers.map((trigger) => trigger.getBoundingClientRect()),
          current,
          event.key
        )
      ]
    setActiveSlug(next.dataset.slug ?? null)
    next.focus()
  }

  /* Parallax wash that shifts with scroll */
  const { scrollYProgress } = useScroll()
  const washX = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const washY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])

  const tagFacets = facets.tags
  const seriesFacets = facets.series
  const worldCount = (slug: string) =>
    facets.worlds.find((facet) => facet.value === slug)?.count ?? 0
  const unavailable = feed.isDegraded && feed.items.length === 0

  return (
    <main className="relative overflow-x-clip px-4 pt-10 pb-16">
      {/* Atmospheric parallax wash behind the header */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh] opacity-70"
        style={reducedMotion ? undefined : { x: washX, y: washY }}
      >
        <div className="archive-hero-wash" />
      </motion.div>

      <div className="page-shell">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-(--line) pb-6">
          <div className="enter-focus">
            <p className="mono-label">
              Index · {pad(items.length)} {plural(items.length, 'frame', 'frames')}
              {isFiltered ? ` of ${pad(facets.total)}` : ''}
              {activeWorld ? ` · ${activeWorld.name}` : ' · all worlds'}
            </p>
            <h1 className="display-font mt-3 text-4xl font-light text-balance text-(--ink) sm:text-5xl">
              Every frame, on one sheet.
            </h1>
          </div>
          <Link
            to="/"
            hash="worlds"
            className="enter-focus link-glow text-sm font-semibold text-(--muted-strong)"
            style={{ '--enter-delay': '120ms' } as React.CSSProperties}
          >
            Back to the worlds →
          </Link>
        </header>

        <nav aria-label="Filter the Index" className="archive-filters">
          <ul className="archive-world-filters">
            <li>
              <Link
                to="/archive"
                search={withFilter('world', undefined)}
                resetScroll={false}
                viewTransition={false}
                activeOptions={FILTER_LINK_ACTIVE}
                className="filter-pill archive-pill"
              >
                All
                <span className="archive-pill-count">{facets.total}</span>
              </Link>
            </li>
            {worlds.map((world) => (
              <li key={world.slug}>
                <Link
                  to="/archive"
                  search={withFilter('world', world.slug)}
                  resetScroll={false}
                  viewTransition={false}
                  activeOptions={FILTER_LINK_ACTIVE}
                  className="filter-pill archive-pill"
                  style={{ '--pill-accent': world.mood.accent } as React.CSSProperties}
                >
                  <span aria-hidden="true" className="archive-pill-dot" />
                  {world.name}
                  <span className="archive-pill-count">{worldCount(world.slug)}</span>
                </Link>
              </li>
            ))}
          </ul>

          {tagFacets.length > 0 || seriesFacets.length > 0 ? (
            <details className="archive-facets" open={Boolean(filters.tag || filters.series)}>
              <summary>
                <span>Tags{seriesFacets.length > 0 ? ' & series' : ''}</span>
                <span className="archive-pill-count">{tagFacets.length + seriesFacets.length}</span>
              </summary>
              <div className="archive-facet-groups">
                {seriesFacets.length > 0 ? (
                  <ul className="archive-facet-list" aria-label="Series">
                    {seriesFacets.map((facet) => (
                      <li key={facet.value}>
                        <Link
                          to="/archive"
                          search={withFilter('series', facet.value)}
                          resetScroll={false}
                          viewTransition={false}
                          activeOptions={FILTER_LINK_ACTIVE}
                          className="archive-facet"
                        >
                          {facet.value}
                          <span>{facet.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul className="archive-facet-list" aria-label="Tags">
                  {tagFacets.map((facet) => (
                    <li key={facet.value}>
                      <Link
                        to="/archive"
                        search={withFilter('tag', facet.value)}
                        resetScroll={false}
                        viewTransition={false}
                        activeOptions={FILTER_LINK_ACTIVE}
                        className="archive-facet"
                      >
                        #{facet.value}
                        <span>{facet.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ) : null}

          {filters.tag || filters.series ? (
            <div className="archive-active-filters">
              <span className="mono-label">Filtered by</span>
              {filters.series ? (
                <Link
                  to="/archive"
                  search={withFilter('series', undefined)}
                  resetScroll={false}
                  viewTransition={false}
                  className="archive-chip"
                  aria-label={`Remove series filter “${filters.series}”`}
                >
                  Series: {filters.series}
                  <X aria-hidden="true" />
                </Link>
              ) : null}
              {filters.tag ? (
                <Link
                  to="/archive"
                  search={withFilter('tag', undefined)}
                  resetScroll={false}
                  viewTransition={false}
                  className="archive-chip"
                  aria-label={`Remove tag filter #${filters.tag}`}
                >
                  #{filters.tag}
                  <X aria-hidden="true" />
                </Link>
              ) : null}
              <Link
                to="/archive"
                search={NO_FILTERS}
                resetScroll={false}
                viewTransition={false}
                className="archive-clear"
              >
                Clear all
              </Link>
            </div>
          ) : null}
        </nav>

        {feed.isDegraded && !unavailable ? (
          <div className="mt-6">
            <StatusBanner title="Serving cached content.">
              {feed.errorMessage ?? 'The index is showing its last successful snapshot.'}
            </StatusBanner>
          </div>
        ) : null}

        <section className="archive-sheet-region" aria-labelledby="archive-sheet-heading">
          <h2 id="archive-sheet-heading" className="sr-only">
            Frames
          </h2>
          <p className="sr-only" role="status" aria-live="polite">
            Showing {items.length} of {facets.total} {plural(facets.total, 'frame', 'frames')}{' '}
            {describeFilters(filters, activeWorld)}.
          </p>

          {unavailable ? (
            <div className="archive-empty">
              <p className="display-font archive-empty-title">The Index is out of reach.</p>
              <p>
                {feed.errorMessage ??
                  'The photographs could not be loaded just now. Nothing is lost — try again in a moment.'}
              </p>
              <div className="archive-empty-actions">
                <button type="button" onClick={() => void router.invalidate()}>
                  Try again
                </button>
                <Link to="/notes">Read the Field Notes</Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="archive-empty">
              <p className="display-font archive-empty-title">Nothing on this sheet yet.</p>
              <p>No frames {describeFilters(filters, activeWorld)} — yet.</p>
              <div className="archive-empty-actions">
                {filters.tag ? (
                  <Link to="/archive" search={withFilter('tag', undefined)} resetScroll={false}>
                    Remove #{filters.tag}
                  </Link>
                ) : null}
                {filters.world && (filters.tag || filters.series) ? (
                  <Link to="/archive" search={withFilter('world', undefined)} resetScroll={false}>
                    Search every world
                  </Link>
                ) : null}
                <Link to="/archive" search={NO_FILTERS} resetScroll={false}>
                  Show every frame
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Arrow keys are delegated from the focusable links inside (roving tabindex). */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <ul
                key={sheetKey}
                ref={sheetRef}
                onKeyDown={handleSheetKeyDown}
                className="archive-sheet"
              >
                {items.map((item, index) => {
                  const photo = item.photo
                  const { width, height } = photo.metadata
                  const ratio = width > 0 && height > 0 ? width / height : 1
                  const world = photo.category
                    ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
                    : null

                  return (
                    <li
                      key={photo.slug}
                      data-frame-index={index}
                      className="archive-tile"
                      style={
                        {
                          flexBasis: `${Math.round(ratio * 200)}px`,
                          flexGrow: Math.round(ratio * 100),
                          '--tile-index': Math.min(index, 14),
                        } as React.CSSProperties
                      }
                    >
                      <Link
                        to="/photos/$slug"
                        params={{ slug: photo.slug }}
                        state={photoOriginState({ kind: 'archive', filters, viaHistory: true })}
                        preload={false}
                        data-archive-trigger
                        data-slug={photo.slug}
                        tabIndex={photo.slug === tabbableSlug ? 0 : -1}
                        aria-haspopup="dialog"
                        aria-label={`${photo.title}${world ? `, ${world.name}` : ''}`}
                        className="pocket-frame depth-frame archive-frame-trigger group block h-full w-full no-underline"
                        style={
                          {
                            '--glow-color': world?.mood.accent ?? 'var(--accent)',
                          } as React.CSSProperties
                        }
                        onFocus={() => setActiveSlug(photo.slug)}
                        onClick={(event) => {
                          // Plain clicks open the lightbox; modified clicks (new tab,
                          // new window) and no-JS visits follow the link to the photo page.
                          if (
                            event.button !== 0 ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          ) {
                            return
                          }
                          event.preventDefault()
                          openFrame(photo.slug)
                        }}
                        onPointerMove={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect()
                          event.currentTarget.style.setProperty(
                            '--cursor-x',
                            `${event.clientX - rect.left}px`
                          )
                          event.currentTarget.style.setProperty(
                            '--cursor-y',
                            `${event.clientY - rect.top}px`
                          )
                        }}
                      >
                        <PhotoImage
                          publicId={photo.publicId}
                          alt={photo.alt}
                          preset="gallery"
                          sizes={contactSheetTileSizes(width, height)}
                          priority={index < 3}
                          intrinsicWidth={width || undefined}
                          intrinsicHeight={height || undefined}
                          lqip={photo.image?.lqip}
                          palette={photo.metadata.palette}
                          hotspot={photo.image?.hotspot}
                          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                        />
                        <span aria-hidden="true" className="archive-photo-glow" />
                        <span aria-hidden="true" className="archive-focus-cursor">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                        <span
                          aria-hidden="true"
                          className="archive-edge-dot archive-edge-dot--tl"
                        />
                        <span
                          aria-hidden="true"
                          className="archive-edge-dot archive-edge-dot--tr"
                        />
                        <span
                          aria-hidden="true"
                          className="archive-edge-dot archive-edge-dot--bl"
                        />
                        <span
                          aria-hidden="true"
                          className="archive-edge-dot archive-edge-dot--br"
                        />
                        <span aria-hidden="true" className="archive-tile-caption">
                          <span className="truncate text-xs font-medium text-white">
                            {photo.title}
                          </span>
                          <span className="mono-label shrink-0 text-white/80!">
                            {world ? world.name : ''}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <p className="archive-sheet-hint mono-label">
                Arrow keys move between frames · Enter opens the viewer
              </p>
            </>
          )}
        </section>
      </div>

      <FrameCounter total={items.length} sheetRef={sheetRef} resetKey={sheetKey} />
      <ArchiveLightbox
        items={items}
        worlds={worlds}
        activeIndex={frameIndex === -1 ? null : frameIndex}
        onNavigate={pageFrame}
        onClose={closeFrame}
        detailOrigin={detailOrigin}
        onRestoreFocus={restoreFocus}
      />
    </main>
  )
}
