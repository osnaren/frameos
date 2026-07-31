import { useCallback, useEffect, useRef, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { z } from 'zod'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { getPublicWorlds, getWorld } from '@/content/worlds'
import { chrome, focusEase } from '@/lib/motion'
import { getGalleryFeedServer } from '@/server/server-functions/portfolio'

const publicWorldSlugs = getPublicWorlds().map((world) => world.slug)

const archiveSearchSchema = z.object({
  world: z
    .string()
    .optional()
    .transform((value) => (value && publicWorldSlugs.includes(value as never) ? value : undefined)),
})

export const Route = createFileRoute('/archive')({
  validateSearch: archiveSearchSchema,
  loaderDeps: ({ search }) => ({ world: search.world }),
  loader: ({ deps }) => getGalleryFeedServer({ data: { category: deps.world, limit: 48 } }),
  staleTime: 30_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: 'Index \u2014 FrameOS Pocket Worlds' },
            {
              name: 'description',
              content:
                'The full FrameOS archive as a contact sheet: every published frame, photographed on a phone.',
            },
            { name: 'robots', content: loaderData.robots },
          ],
          links: [{ rel: 'canonical', href: loaderData.canonicalUrl }],
        }
      : {},
  component: ArchiveRoute,
})

const BATCH_SIZE = 12

function staggerDelay(index: number) {
  const batch = Math.floor(index / BATCH_SIZE)
  const withinBatch = index % BATCH_SIZE
  return batch * 0.08 + withinBatch * 0.04
}

/** Frame counter badge that shows how many frames have been scrolled past. */
function FrameCounter({
  total,
  containerRef,
}: {
  total: number
  containerRef: React.RefObject<HTMLElement | null>
}) {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.1,
    })
    observer.observe(container)

    const onScroll = () => {
      const items = container.querySelectorAll('[data-frame-index]')
      let count = 0
      for (const item of items) {
        const rect = item.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.7) count++
      }
      setCurrent(count)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [containerRef, reducedMotion])

  if (reducedMotion) return null

  return (
    <div className={`frame-counter ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      <span className="frame-counter-dot" />
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  )
}

/** 3D perspective tilt effect on hover. */
function useTilt(ref: React.RefObject<HTMLElement | null>) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--tilt-x', `${-y * 6}deg`)
      el.style.setProperty('--tilt-y', `${x * 6}deg`)
    },
    [ref]
  )

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }, [ref])

  return { handleMouseMove, handleMouseLeave }
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { handleMouseMove, handleMouseLeave } = useTilt(ref)

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`tilt-card ${className ?? ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="tilt-card-inner h-full">{children}</div>
    </div>
  )
}

/**
 * The Index: an editorial contact sheet with scroll-triggered reveals,
 * staggered grid animation, 3D perspective hover, frame counter,
 * atmospheric depth, and world-accent hover glow.
 */
function ArchiveRoute() {
  const feed = Route.useLoaderData()
  const search = Route.useSearch()
  const sheetRef = useRef<HTMLUListElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const worlds = getPublicWorlds()
  const activeWorld = search.world ? getWorld(search.world) : null

  /* Parallax wash that shifts with scroll */
  const { scrollYProgress } = useScroll()
  const washX = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const washY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])

  const handleSheetKeyDown = (event: React.KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      return
    }

    const links = Array.from(sheetRef.current?.querySelectorAll('a') ?? [])
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement)

    if (currentIndex === -1) {
      return
    }

    event.preventDefault()
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = links[(currentIndex + delta + links.length) % links.length]
    next.focus()
  }

  return (
    <main ref={mainRef} className="relative overflow-x-clip px-4 pt-10 pb-16">
      {/* Atmospheric parallax wash behind the header */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh] opacity-70"
        style={reducedMotion ? undefined : { x: washX, y: washY }}
      >
        <div className="archive-hero-wash" />
      </motion.div>

      <div className="page-shell">
        {/* Header with staggered entrance */}
        <motion.header
          className="flex flex-wrap items-end justify-between gap-6 border-b border-(--line) pb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: { duration: 0.7, ease: focusEase },
              },
            }}
          >
            <p className="mono-label">
              Index · {String(feed.items.length).padStart(2, '0')} frames
              {activeWorld ? ` · ${activeWorld.name}` : ' · all worlds'}
            </p>
            <h1 className="display-font text-balance mt-3 text-4xl font-light text-(--ink) sm:text-5xl">
              Every frame, on one sheet.
            </h1>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, x: 12 },
              visible: {
                opacity: 1,
                x: 0,
                transition: { duration: 0.5, ease: focusEase },
              },
            }}
          >
            <Link
              to="/"
              hash="worlds"
              className="link-glow text-sm font-semibold text-(--muted-strong)"
            >
              Back to the worlds →
            </Link>
          </motion.div>
        </motion.header>

        {/* Filter pills with staggered entrance */}
        <motion.nav
          aria-label="Filter by world"
          className="mt-6 flex flex-wrap gap-2.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1, transition: chrome },
            }}
          >
            <Link
              to="/archive"
              search={{}}
              aria-current={!activeWorld ? 'true' : undefined}
              className={`filter-pill rounded-full border px-5 py-2.5 font-mono text-[0.78rem] tracking-[0.12em] uppercase no-underline transition-all duration-300 ${
                !activeWorld
                  ? 'border-(--ink) bg-(--ink) text-(--bg)!'
                  : 'border-(--line) text-(--muted-strong) hover:border-(--ink)'
              }`}
            >
              All
            </Link>
          </motion.div>
          {worlds.map((world) => {
            const isActive = activeWorld?.slug === world.slug

            return (
              <motion.div
                key={world.slug}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1, transition: chrome },
                }}
              >
                <Link
                  to="/archive"
                  search={{ world: world.slug }}
                  aria-current={isActive ? 'true' : undefined}
                  className={`filter-pill inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-[0.78rem] tracking-[0.12em] uppercase no-underline transition-all duration-300 ${
                    isActive
                      ? 'border-(--ink) bg-(--ink) text-(--bg)!'
                      : 'border-(--line) hover:border-(--ink)'
                  }`}
                  style={{ color: isActive ? undefined : world.mood.accent }}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: isActive ? 'currentColor' : world.mood.accent }}
                  />
                  {world.name}
                </Link>
              </motion.div>
            )
          })}
        </motion.nav>

        {feed.isDegraded ? (
          <div className="mt-6">
            <StatusBanner title="Serving cached content.">
              {feed.errorMessage ?? 'The index is showing its last successful snapshot.'}
            </StatusBanner>
          </div>
        ) : null}

        {/* Justified contact-sheet rows with staggered scroll reveal + 3D tilt */}
        {feed.items.length === 0 ? (
          <p className="mono-label mt-16 text-center">
            No frames in {activeWorld ? activeWorld.name : 'this world'} yet — try another world.
          </p>
        ) : (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <ul
            ref={sheetRef}
            onKeyDown={handleSheetKeyDown}
            className="mt-8 flex list-none flex-wrap gap-2 p-0"
          >
            {feed.items.map((item, index) => {
              const photo = item.photo
              const { width, height } = photo.metadata
              const ratio = width > 0 && height > 0 ? width / height : 1
              const world = photo.category ? getWorld(photo.category) : null

              return (
                <motion.li
                  key={photo.slug}
                  data-frame-index={index}
                  className="m-0 grow"
                  style={{
                    flexBasis: `${Math.round(ratio * 200)}px`,
                    flexGrow: Math.round(ratio * 100),
                  }}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.96 }}
                  whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-40px 0px' }}
                  transition={{
                    duration: 0.6,
                    delay: staggerDelay(index),
                    ease: focusEase,
                  }}
                >
                  <TiltCard className="h-full">
                    <Link
                      to="/photos/$slug"
                      params={{ slug: photo.slug }}
                      viewTransition={false}
                      aria-label={`View \u201c${photo.title}\u201d`}
                      className="pocket-frame depth-frame group block h-full no-underline"
                      style={
                        {
                          '--glow-color': world?.mood.accent ?? 'var(--accent)',
                        } as React.CSSProperties
                      }
                    >
                      <PhotoImage
                        publicId={photo.publicId}
                        alt={photo.alt}
                        preset="gallery"
                        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px"
                        priority={index < 6}
                        intrinsicWidth={width || undefined}
                        intrinsicHeight={height || undefined}
                        className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                        style={{
                          aspectRatio: `${width || 1} / ${height || 1}`,
                        }}
                      />
                      <span aria-hidden="true" className="archive-photo-glow" />
                      <span aria-hidden="true" className="frame-corners" />
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 z-2 flex items-baseline justify-between gap-2 bg-linear-to-t from-black/60 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <span className="truncate text-xs font-medium text-white">
                          {photo.title}
                        </span>
                        <span className="mono-label shrink-0 text-white/80!">
                          {world ? world.name : ''}
                        </span>
                      </span>
                    </Link>
                  </TiltCard>
                </motion.li>
              )
            })}
          </ul>
        )}

        <p className="mono-label mt-10">Arrow keys move between frames</p>
      </div>

      {/* Floating frame counter */}
      <FrameCounter total={feed.items.length} containerRef={mainRef} />
    </main>
  )
}
