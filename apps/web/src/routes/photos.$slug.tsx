import { useEffect, useRef, useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type PanInfo,
} from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import {
  getGalleryFeedServer,
  getPhotoDetailServer,
  getWorldsServer,
} from '@/server/server-functions/portfolio'

import type { Photo } from '@/types/photo'

export const Route = createFileRoute('/photos/$slug')({
  loader: async ({ params }) => {
    const [detail, worlds] = await Promise.all([
      getPhotoDetailServer({ data: { slug: params.slug } }),
      getWorldsServer(),
    ])
    const photo = detail!.photo
    const feed = photo.category
      ? await getGalleryFeedServer({ data: { category: photo.category, limit: 48 } })
      : null
    const siblings = feed?.items.map((item) => item.photo.slug) ?? []
    const position = siblings.indexOf(photo.slug)

    return {
      detail: detail!,
      worlds: worlds!,
      siblings,
      position,
    }
  },
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.detail.photo.title} — FrameOS` },
            {
              name: 'description',
              content: loaderData.detail.photo.caption ?? loaderData.detail.photo.alt,
            },
          ],
          links: [{ rel: 'canonical', href: loaderData.detail.canonicalUrl }],
        }
      : {},
  component: PhotoDetailRoute,
})

function CopyLinkButton({ canonicalUrl }: { canonicalUrl: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(canonicalUrl).then(() => setCopied(true))
      }}
      className="mono-label cursor-pointer rounded-full border border-(--line) bg-(--panel) px-4 py-2 transition-all duration-300 hover:border-(--accent) hover:shadow-md focus-visible:border-(--accent) active:scale-95"
    >
      <span>{copied ? 'Link copied' : 'Copy link'}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied to the clipboard' : ''}
      </span>
    </button>
  )
}

function MetadataHotspot({ photo }: { photo: Photo }) {
  const [open, setOpen] = useState(false)
  const metadata = photo.metadata
  const aspectRatio =
    metadata.width > 0 && metadata.height > 0 ? metadata.width / metadata.height : null
  const details = [
    ['Camera', metadata.camera],
    ['Lens', metadata.lens],
    ['Focal length', metadata.focalLength],
    ['Aperture', metadata.aperture],
    ['Shutter', metadata.shutterSpeed],
    ['ISO', metadata.iso],
    [
      'Dimensions',
      metadata.width > 0 && metadata.height > 0
        ? `${metadata.width.toLocaleString()} × ${metadata.height.toLocaleString()}`
        : undefined,
    ],
    ['Aspect', aspectRatio ? `${aspectRatio.toFixed(2)} : 1` : undefined],
    ['Format', metadata.format.toUpperCase()],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  const hasExif = Boolean(
    metadata.camera || metadata.lens || metadata.aperture || metadata.shutterSpeed || metadata.iso
  )

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="photo-metadata-hotspot"
        aria-label="Open photograph information"
        aria-expanded={open}
        aria-controls="photo-capture-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" />
        <span className="photo-metadata-hotspot-label">Capture data</span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="photo-metadata-backdrop"
              aria-label="Close photograph information"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              id="photo-capture-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Photograph information"
              className="photo-metadata-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="photo-metadata-panel-head">
                <div>
                  <p className="mono-label m-0">Digital contact point</p>
                  <p className="display-font m-0 mt-1 text-2xl font-light">Capture data</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>
              <dl className="photo-metadata-grid">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {!hasExif ? (
                <p className="display-italic mt-5 text-sm leading-6 text-(--muted-strong)">
                  This one didn&rsquo;t keep its camera settings — just the frame itself.
                </p>
              ) : null}
              <p className="mono-label m-0 mt-5">Tap outside or press Esc to close</p>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}

function PhotoDetailRoute() {
  const { detail, worlds, siblings, position } = Route.useLoaderData()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const figureRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: figureRef,
    offset: ['start end', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 0.5, 1], [28, 0, -28])
  const mediaScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1, 0.985])
  const [touchCapable, setTouchCapable] = useState(false)
  /* The photograph settles first; words arrive second. */
  const settleDelay = reducedMotion ? 0 : 0.38
  const photo = detail.photo
  const world = photo.category
    ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
    : null
  const previousSlug = position > 0 ? siblings[position - 1] : null
  const nextSlug = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null
  const washColor = photo.metadata.palette?.[0]

  useEffect(() => {
    setTouchCapable(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && previousSlug) {
        void navigate({ to: '/photos/$slug', params: { slug: previousSlug } })
      }

      if (event.key === 'ArrowRight' && nextSlug) {
        void navigate({ to: '/photos/$slug', params: { slug: nextSlug } })
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate, previousSlug, nextSlug])

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    const swipePower = Math.abs(info.offset.x) * info.velocity.x

    if (swipePower < -8000 && nextSlug) {
      void navigate({ to: '/photos/$slug', params: { slug: nextSlug } })
    } else if (swipePower > 8000 && previousSlug) {
      void navigate({ to: '/photos/$slug', params: { slug: previousSlug } })
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
            ? `Frame ${position + 1} of ${siblings.length}: ${photo.title}`
            : photo.title}
        </p>

        <nav
          aria-label="Photograph context"
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          {world ? (
            <Link
              to="/worlds/$world"
              params={{ world: world.slug }}
              className="mono-label no-underline hover:text-(--ink)"
            >
              ← {world.name}
            </Link>
          ) : null}
          <Link to="/archive" className="mono-label no-underline hover:text-(--ink)">
            Index
          </Link>
          {position >= 0 ? (
            <span className="mono-label ml-auto">
              frame {String(position + 1).padStart(2, '0')} /{' '}
              {String(siblings.length).padStart(2, '0')}
            </span>
          ) : null}
        </nav>

        <motion.figure
          ref={figureRef}
          className="photo-detail-stage relative m-0 mt-6"
          initial={reducedMotion ? undefined : { opacity: 0, scale: 0.985 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="photo-detail-index" aria-hidden="true">
            {position >= 0 ? String(position + 1).padStart(2, '0') : 'FO'}
          </span>
          <motion.div
            className="photo-detail-media pocket-frame mx-auto w-fit max-w-full touch-pan-y"
            style={{
              aspectRatio:
                photo.metadata.width > 0 && photo.metadata.height > 0
                  ? `${photo.metadata.width} / ${photo.metadata.height}`
                  : undefined,
              y: reducedMotion ? undefined : mediaY,
              scale: reducedMotion ? undefined : mediaScale,
            }}
            drag={touchCapable ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
          >
            <PhotoImage
              publicId={photo.publicId}
              alt={photo.alt}
              preset="detail"
              priority
              sizes="(max-width: 1024px) 100vw, 76vw"
              intrinsicWidth={photo.metadata.width || undefined}
              intrinsicHeight={photo.metadata.height || undefined}
              lqip={photo.image?.lqip}
              hotspot={photo.image?.hotspot}
              className="mx-auto h-auto max-h-[76svh] w-auto max-w-full"
            />
            <span className="photo-detail-sheen" aria-hidden="true" />
            <span className="frame-corners" aria-hidden="true" />
            <MetadataHotspot photo={photo} />
          </motion.div>
          {touchCapable && (previousSlug || nextSlug) ? (
            <p className="mono-label mt-3 text-center">Swipe to browse</p>
          ) : null}

          <motion.figcaption
            className="mx-auto mt-8 max-w-2xl text-center"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: settleDelay, ease: [0.16, 1, 0.3, 1] }}
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
                  <dd>{world.name}</dd>
                </div>
              ) : null}
              {photo.locationLabel ? (
                <div className="flex items-baseline gap-2">
                  <dt>Place</dt>
                  <dd>{photo.locationLabel}</dd>
                </div>
              ) : null}
              {photo.captureDate ? (
                <div className="flex items-baseline gap-2">
                  <dt>Date</dt>
                  <dd>{photo.captureDate.slice(0, 10)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline gap-2">
                <dt>Made with</dt>
                <dd>A phone</dd>
              </div>
            </dl>
          </motion.figcaption>
        </motion.figure>

        <motion.nav
          aria-label="Previous and next photographs"
          className="mt-10 flex items-center justify-between gap-4 border-t border-(--line) pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: settleDelay + 0.12 }}
        >
          {previousSlug ? (
            <Link
              to="/photos/$slug"
              params={{ slug: previousSlug }}
              className="text-sm font-semibold text-(--muted-strong) no-underline hover:text-(--ink)"
            >
              ← Previous
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <CopyLinkButton canonicalUrl={detail.canonicalUrl} />
          {nextSlug ? (
            <Link
              to="/photos/$slug"
              params={{ slug: nextSlug }}
              className="text-sm font-semibold text-(--muted-strong) no-underline hover:text-(--ink)"
            >
              Next →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </motion.nav>

        {detail.isDegraded ? (
          <div className="mt-8">
            <StatusBanner title="Serving cached content.">
              This photograph is showing the last successful snapshot while the provider refreshes.
            </StatusBanner>
          </div>
        ) : null}
      </div>
    </main>
  )
}
