import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { motion, useScroll, useTransform, type MotionStyle, type PanInfo } from 'framer-motion'
import { ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoSkeleton } from '@/components/layout/RouteSkeletons'
import { CaptureDataPopover } from '@/components/photo/CaptureDataPopover'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { PhotoViewerDialog } from '@/components/photo/PhotoViewerDialog'
import { ShareButton } from '@/components/photo/ShareButton'
import { useHydrated } from '@/hooks/use-hydrated'
import { formatCaptureDate } from '@/lib/capture-details'
import { loadCompleteGalleryFeed } from '@/lib/gallery-feed'
import { isInPublicWorld } from '@/lib/gallery-search'
import { resolveSwipe } from '@/lib/gestures'
import { containedImageSizes } from '@/lib/image-policy'
import { useHydratedReducedMotion } from '@/lib/motion'
import {
  carryPhotoOrigin,
  describePhotoOrigin,
  fallbackPhotoOrigin,
  readPhotoOrigin,
  type PhotoOrigin,
} from '@/lib/photo-origin'
import { preloadPhoto, resolvePhotoSources } from '@/lib/photo-sources'
import { buildSeoHead, getPhotoShareImage, photographJsonLd } from '@/lib/seo'
import { getPhotoDetailServer, getWorldsServer } from '@/server/server-functions/portfolio'

import type { Photo } from '@/types/photo'

export const Route = createFileRoute('/photos/$slug')({
  loader: async ({ params }) => {
    const [detail, worlds] = await Promise.all([
      getPhotoDetailServer({ data: { slug: params.slug } }),
      getWorldsServer(),
    ])
    const photo = detail!.photo
    const worldSlugs = worlds!.map((world) => world.slug)

    // Fail closed: a photo filed under a world that isn't public stays private.
    if (!isInPublicWorld(photo, worldSlugs)) {
      throw notFound()
    }

    // The whole world (every cursor page), so prev/next and "more from this
    // world" never stop at the feed's page size.
    const feed = await loadCompleteGalleryFeed(photo.category ? { category: photo.category } : {})
    const sequence = feed.items
      .map((item) => item.photo)
      .filter((entry) => isInPublicWorld(entry, worldSlugs))

    return { detail: detail!, worlds: worlds!, sequence }
  },
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {}
    }

    const { photo, canonicalUrl } = loaderData.detail
    const world = loaderData.worlds.find((entry) => entry.slug === photo.category)

    return buildSeoHead({
      title: `${photo.title} — FrameOS`,
      description: photo.caption ?? photo.alt,
      canonicalUrl,
      type: 'article',
      image: getPhotoShareImage(photo, new URL(canonicalUrl).origin),
      // Fail closed: a frame filed under a world that isn't public stays out of search.
      robots: photo.category && !world ? 'noindex,follow' : undefined,
      jsonLd: [photographJsonLd({ canonicalUrl, photo, world })],
    })
  },
  pendingComponent: PhotoSkeleton,
  component: PhotoDetailRoute,
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function orientationOf(photo: Photo) {
  const { width, height } = photo.metadata
  if (width > 0 && height > width * 1.08) return 'portrait'
  if (width > height * 1.08) return 'landscape'
  return 'square'
}

/** Mirrors the .photo-detail-media sizing rules in styles.css. */
function detailSizes(photo: Photo) {
  const portrait = orientationOf(photo) === 'portrait'
  return containedImageSizes(photo.metadata.width, photo.metadata.height, [
    {
      media: '(max-width: 640px)',
      maxWidths: ['calc(100vw - 4rem)'],
      maxHeights: [portrait ? '54vh' : '72vh'],
    },
    {
      maxWidths: ['1240px', 'calc(100vw - 4rem)'],
      maxHeights: portrait ? ['58vh', '40rem'] : ['72vh', '52rem'],
    },
  ])
}

/** True while a popover or dialog owns the keyboard (its own Esc/arrows win). */
function overlayIsOpen() {
  return Boolean(
    document.querySelector(
      '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"]'
    )
  )
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  )
}

/** The way back: a real history step when we know the previous entry is the origin. */
function OriginLink({
  origin,
  label,
  onReturn,
}: {
  origin: PhotoOrigin
  label: string
  onReturn?: () => void
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onReturn || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    onReturn()
  }

  const content = (
    <>
      <ArrowLeft aria-hidden="true" />
      <span>
        <span className="sr-only">Back to </span>
        {label}
      </span>
    </>
  )

  return origin.kind === 'world' ? (
    <Link
      to="/worlds/$world"
      params={{ world: origin.world }}
      className="photo-detail-back"
      onClick={handleClick}
    >
      {content}
    </Link>
  ) : (
    <Link to="/archive" search={origin.filters} className="photo-detail-back" onClick={handleClick}>
      {content}
    </Link>
  )
}

function PhotoDetailRoute() {
  const { detail, worlds, sequence } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const hydrated = useHydrated()
  const historyState = useRouterState({ select: (state) => state.location.state })
  const reducedMotion = useHydratedReducedMotion()
  const figureRef = useRef<HTMLElement>(null)
  const [touchCapable, setTouchCapable] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const { scrollYProgress } = useScroll({
    target: figureRef,
    offset: ['start end', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 0.5, 1], [28, 0, -28])
  const mediaScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1, 0.985])

  const photo = detail.photo
  const worldSlugs = worlds.map((entry) => entry.slug)
  const worldName = (slug: string) => worlds.find((entry) => entry.slug === slug)?.name
  const world = photo.category
    ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
    : null

  // History state only exists in the browser; read it after hydration so the
  // first render matches the server's (fallback) breadcrumb.
  const storedOrigin = hydrated ? readPhotoOrigin(historyState) : null
  const origin = storedOrigin ?? fallbackPhotoOrigin(photo.category, worldSlugs)
  const originLabel = describePhotoOrigin(origin, worldName)

  const position = sequence.findIndex((entry) => entry.slug === photo.slug)
  const previous = position > 0 ? sequence[position - 1] : null
  const next = position >= 0 && position < sequence.length - 1 ? sequence[position + 1] : null
  const others = sequence.filter((entry) => entry.slug !== photo.slug)
  const worldIndex = world ? worlds.findIndex((entry) => entry.slug === world.slug) : -1
  const hasWorldNeighbours = worldIndex >= 0 && worlds.length > 1
  const previousWorld = hasWorldNeighbours
    ? worlds[(worldIndex - 1 + worlds.length) % worlds.length]
    : null
  const nextWorld = hasWorldNeighbours ? worlds[(worldIndex + 1) % worlds.length] : null
  const washColor = photo.metadata.palette?.[0]
  const orientation = orientationOf(photo)
  const ratio =
    photo.metadata.width > 0 && photo.metadata.height > 0
      ? photo.metadata.width / photo.metadata.height
      : 1
  const captureDate = formatCaptureDate(photo.captureDate)
  const counter = position >= 0 ? `${pad(position + 1)} / ${pad(sequence.length)}` : undefined
  const sequenceLabel = world ? world.name : 'the archive'

  /** Sideways moves replace the history entry, so Back still returns to the origin. */
  const goTo = useCallback(
    (slug: string) =>
      void navigate({
        to: '/photos/$slug',
        params: { slug },
        replace: true,
        state: carryPhotoOrigin(storedOrigin),
      }),
    [navigate, storedOrigin]
  )

  const returnToOrigin = useCallback(() => {
    if (storedOrigin?.viaHistory) {
      router.history.back()
      return
    }

    if (origin.kind === 'world') {
      void navigate({ to: '/worlds/$world', params: { world: origin.world } })
    } else {
      void navigate({ to: '/archive', search: origin.filters })
    }
  }, [navigate, origin, router, storedOrigin])

  useEffect(() => {
    setTouchCapable(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  // ← → page through the world; Esc returns to wherever you came from.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTypingTarget(event.target) ||
        overlayIsOpen()
      ) {
        return
      }

      if (event.key === 'ArrowLeft' && previous) {
        event.preventDefault()
        goTo(previous.slug)
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault()
        goTo(next.slug)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        returnToOrigin()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goTo, next, previous, returnToOrigin])

  // Warm the neighbours (image and route data) so paging is instant.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const neighbour of [next, previous]) {
        if (!neighbour) continue
        preloadPhoto(
          resolvePhotoSources({
            publicId: neighbour.publicId,
            preset: 'detail',
            hotspot: neighbour.image?.hotspot,
          }),
          detailSizes(neighbour)
        )
        void router
          .preloadRoute({ to: '/photos/$slug', params: { slug: neighbour.slug } })
          .catch(() => {})
      }
    }, 500)

    return () => window.clearTimeout(timer)
  }, [next, previous, router])

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    const direction = resolveSwipe({
      dx: info.offset.x,
      dy: info.offset.y,
      velocityX: info.velocity.x,
    })

    if (direction === 1 && next) {
      goTo(next.slug)
    } else if (direction === -1 && previous) {
      goTo(previous.slug)
    }
  }

  return (
    <main
      className="relative px-4 pt-6 pb-16"
      style={
        world
          ? ({
              '--world-accent': world.mood.accent,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Quiet ambient wash pulled from the photograph's own palette */}
      {washColor ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64vh]"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${washColor} 16%, transparent), transparent)`,
          }}
        />
      ) : null}

      <div className="page-shell">
        <p role="status" aria-live="polite" className="sr-only">
          {position >= 0
            ? `Frame ${position + 1} of ${sequence.length} in ${sequenceLabel}: ${photo.title}`
            : photo.title}
        </p>

        <nav aria-label="Photograph context" className="photo-detail-trail">
          <OriginLink
            origin={origin}
            label={originLabel}
            onReturn={storedOrigin?.viaHistory ? returnToOrigin : undefined}
          />
          <span className="photo-detail-crumbs">
            {origin.kind === 'world' ? (
              <Link to="/archive" className="mono-label">
                Index
              </Link>
            ) : world ? (
              <Link to="/worlds/$world" params={{ world: world.slug }} className="mono-label">
                {world.name}
              </Link>
            ) : null}
            {counter ? <span className="mono-label">Frame {counter}</span> : null}
          </span>
        </nav>

        <figure
          ref={figureRef}
          data-orientation={orientation}
          className="photo-detail-stage relative m-0 mt-6"
        >
          <span className="photo-detail-index" aria-hidden="true">
            {position >= 0 ? pad(position + 1) : 'FO'}
          </span>

          <div className="photo-detail-frame">
            {previous ? (
              <Link
                to="/photos/$slug"
                params={{ slug: previous.slug }}
                replace
                state={carryPhotoOrigin(storedOrigin)}
                className="photo-stage-nav photo-stage-nav--previous"
                aria-label={`Previous photograph: ${previous.title}`}
                aria-keyshortcuts="ArrowLeft"
              >
                <ArrowLeft aria-hidden="true" />
              </Link>
            ) : null}

            <motion.div
              data-orientation={orientation}
              className="photo-detail-media photo-detail-enter pocket-frame touch-pan-y"
              style={
                {
                  '--photo-ratio': ratio,
                  y: reducedMotion ? undefined : mediaY,
                  scale: reducedMotion ? undefined : mediaScale,
                } as MotionStyle
              }
              drag={touchCapable && (previous || next) ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              dragDirectionLock
              onDragEnd={handleDragEnd}
            >
              <PhotoImage
                publicId={photo.publicId}
                alt={photo.alt}
                preset="detail"
                priority
                sizes={detailSizes(photo)}
                intrinsicWidth={photo.metadata.width || undefined}
                intrinsicHeight={photo.metadata.height || undefined}
                lqip={photo.image?.lqip}
                palette={photo.metadata.palette}
                hotspot={photo.image?.hotspot}
                className="photo-detail-image"
              />
              <span className="photo-detail-sheen" aria-hidden="true" />
              <span className="frame-corners" aria-hidden="true" />
              <button
                type="button"
                className="photo-expand"
                onClick={() => setViewerOpen(true)}
                aria-label="View full screen"
              >
                <Maximize2 aria-hidden="true" />
              </button>
              <CaptureDataPopover photo={photo} />
            </motion.div>

            {next ? (
              <Link
                to="/photos/$slug"
                params={{ slug: next.slug }}
                replace
                state={carryPhotoOrigin(storedOrigin)}
                className="photo-stage-nav photo-stage-nav--next"
                aria-label={`Next photograph: ${next.title}`}
                aria-keyshortcuts="ArrowRight"
              >
                <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {touchCapable && (previous || next) ? (
            <p className="mono-label mt-3 text-center">Swipe to browse · tap ⤢ for full screen</p>
          ) : null}

          <figcaption
            className="enter-focus mx-auto mt-8 max-w-2xl text-center"
            style={{ '--enter-delay': reducedMotion ? '0ms' : '320ms' } as React.CSSProperties}
          >
            <h1 className="display-font text-3xl leading-tight font-light text-(--ink) sm:text-4xl">
              {photo.title}
            </h1>
            {photo.caption ? (
              <p className="display-italic mt-3 text-lg leading-8 text-(--muted-strong)">
                {photo.caption}
              </p>
            ) : null}
            {photo.description ? (
              <p className="mx-auto mt-5 max-w-prose text-sm leading-7 text-(--muted)">
                {photo.description}
              </p>
            ) : null}
            <dl className="metadata-list mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {world ? (
                <div className="flex items-baseline gap-2">
                  <dt>World</dt>
                  <dd>
                    <Link
                      to="/worlds/$world"
                      params={{ world: world.slug }}
                      className="photo-detail-link"
                    >
                      {world.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {photo.series ? (
                <div className="flex items-baseline gap-2">
                  <dt>Series</dt>
                  <dd>
                    <Link
                      to="/archive"
                      search={{ series: photo.series }}
                      className="photo-detail-link"
                    >
                      {photo.series}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {photo.locationLabel ? (
                <div className="flex items-baseline gap-2">
                  <dt>Place</dt>
                  <dd>{photo.locationLabel}</dd>
                </div>
              ) : null}
              {captureDate ? (
                <div className="flex items-baseline gap-2">
                  <dt>Date</dt>
                  <dd>{captureDate}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline gap-2">
                <dt>Made with</dt>
                <dd>A phone</dd>
              </div>
            </dl>
            {photo.tags.length > 0 ? (
              <ul className="photo-detail-tags" aria-label="Tags — each opens the Index filtered">
                {photo.tags.map((tag) => (
                  <li key={tag}>
                    <Link to="/archive" search={{ tag }}>
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </figcaption>
        </figure>

        <nav aria-label="Previous and next photographs" className="photo-detail-pager">
          {previous ? (
            <Link
              to="/photos/$slug"
              params={{ slug: previous.slug }}
              replace
              state={carryPhotoOrigin(storedOrigin)}
              className="photo-pager-link"
            >
              <span className="mono-label">← Previous</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : previousWorld ? (
            <Link
              to="/worlds/$world"
              params={{ world: previousWorld.slug }}
              className="photo-pager-link"
            >
              <span className="mono-label">← Previous world</span>
              <strong>{previousWorld.name}</strong>
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}

          <div className="photo-detail-actions">
            <ShareButton
              url={detail.canonicalUrl}
              title={photo.title}
              text={photo.caption}
              className="photo-action"
            />
            <button type="button" className="photo-action" onClick={() => setViewerOpen(true)}>
              <Maximize2 aria-hidden="true" />
              <span>Full screen</span>
            </button>
          </div>

          {next ? (
            <Link
              to="/photos/$slug"
              params={{ slug: next.slug }}
              replace
              state={carryPhotoOrigin(storedOrigin)}
              className="photo-pager-link photo-pager-link--next"
            >
              <span className="mono-label">Next →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : nextWorld ? (
            <Link
              to="/worlds/$world"
              params={{ world: nextWorld.slug }}
              className="photo-pager-link photo-pager-link--next"
            >
              <span className="mono-label">Next world →</span>
              <strong>{nextWorld.name}</strong>
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>

        {others.length > 0 ? (
          <section className="photo-more" aria-labelledby="photo-more-heading">
            <div className="photo-more-head">
              <h2 id="photo-more-heading" className="display-font">
                More from {sequenceLabel}
              </h2>
              <div className="photo-more-links">
                {world ? (
                  <Link to="/worlds/$world" params={{ world: world.slug }}>
                    Visit {world.name}
                  </Link>
                ) : null}
                <Link to="/archive" search={world ? { world: world.slug } : {}}>
                  {world ? `${world.name} in the Index` : 'Open the Index'}
                </Link>
              </div>
            </div>
            <ul className="photo-more-strip">
              {others.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    to="/photos/$slug"
                    params={{ slug: entry.slug }}
                    replace
                    state={carryPhotoOrigin(storedOrigin)}
                    className="photo-more-link"
                  >
                    <span className="pocket-frame photo-more-frame">
                      <PhotoImage
                        publicId={entry.publicId}
                        alt=""
                        preset="thumb"
                        sizes="(max-width: 640px) 38vw, 180px"
                        lqip={entry.image?.lqip}
                        palette={entry.metadata.palette}
                        hotspot={entry.image?.hotspot}
                        className="h-full w-full object-cover"
                      />
                      <span className="frame-corners" aria-hidden="true" />
                    </span>
                    <span className="photo-more-title">{entry.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="photo-more" aria-label="Keep exploring">
            <div className="photo-more-head">
              <p className="display-font photo-more-solo">
                This is the only frame in {sequenceLabel} so far.
              </p>
              <div className="photo-more-links">
                {nextWorld ? (
                  <Link to="/worlds/$world" params={{ world: nextWorld.slug }}>
                    Next world: {nextWorld.name}
                  </Link>
                ) : null}
                <Link to="/archive">Open the Index</Link>
              </div>
            </div>
          </section>
        )}

        {detail.isDegraded ? (
          <div className="mt-8">
            <StatusBanner title="Serving cached content.">
              This photograph is showing the last successful snapshot while the provider refreshes.
            </StatusBanner>
          </div>
        ) : null}
      </div>

      <PhotoViewerDialog
        photo={photo}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onPage={(direction) => {
          const target = direction === 1 ? next : previous
          if (target) goTo(target.slug)
        }}
        hasPrevious={Boolean(previous)}
        hasNext={Boolean(next)}
        counter={counter}
      />
    </main>
  )
}
