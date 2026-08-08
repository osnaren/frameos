import { useEffect, useRef, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { z } from 'zod'

import { ArchiveLightbox } from '@/components/archive/ArchiveLightbox'
import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { chrome, focusEase, useHydratedReducedMotion } from '@/lib/motion'
import { getGalleryFeedServer, getWorldsServer } from '@/server/server-functions/portfolio'

const archiveSearchSchema = z.object({
  world: z
    .string()
    .trim()
    .min(1)
    .max(72)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/archive')({
  validateSearch: archiveSearchSchema,
  loaderDeps: ({ search }) => ({ world: search.world }),
  loader: async ({ deps }) => {
    const worlds = await getWorldsServer()
    const activeWorld = worlds!.find((world) => world.slug === deps.world)
    const feed = await getGalleryFeedServer({
      data: { category: activeWorld?.slug, limit: 48 },
    })
    return { feed, worlds: worlds! }
  },
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
            { name: 'robots', content: loaderData.feed.robots },
          ],
          links: [{ rel: 'canonical', href: loaderData.feed.canonicalUrl }],
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
  const reducedMotion = useHydratedReducedMotion()
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const container = containerRef.current
    if (!container) return

    setCurrent(0)

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
      setCurrent(Math.min(count, total))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [containerRef, reducedMotion, total])

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

/**
 * The Index: an editorial contact sheet with scroll-triggered reveals,
 * staggered grid animation, focus-frame hover, frame counter,
 * atmospheric depth, and world-accent hover glow.
 */
function ArchiveRoute() {
  const { feed, worlds } = Route.useLoaderData()
  const search = Route.useSearch()
  const sheetRef = useRef<HTMLUListElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const lightboxTriggerRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useHydratedReducedMotion()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeWorld = search.world
    ? (worlds.find((world) => world.slug === search.world) ?? null)
    : null
  const contactSheetKey = activeWorld?.slug ?? 'all-worlds'

  const handleLightboxIndexChange = (index: number | null) => {
    setActiveIndex(index)
    if (index === null) {
      requestAnimationFrame(() => lightboxTriggerRef.current?.focus())
    }
  }

  /* Parallax wash that shifts with scroll */
  const { scrollYProgress } = useScroll()
  const washX = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const washY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])

  const handleSheetKeyDown = (event: React.KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      return
    }

    const triggers = Array.from(
      sheetRef.current?.querySelectorAll<HTMLButtonElement>('[data-archive-trigger]') ?? []
    )
    const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement)

    if (currentIndex === -1) {
      return
    }

    event.preventDefault()
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = triggers[(currentIndex + delta + triggers.length) % triggers.length]
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

        <section className="archive-sheet-region">
          <p className="sr-only" role="status" aria-live="polite">
            Showing {feed.items.length} frames
            {activeWorld ? ` from ${activeWorld.name}` : ' from all worlds'}.
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={contactSheetKey}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 14, scale: 0.995, filter: 'blur(5px)' }
              }
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.998, filter: 'blur(3px)' }
              }
              transition={{ duration: reducedMotion ? 0.15 : 0.42, ease: focusEase }}
            >
              {/* Justified contact-sheet rows with staggered scroll reveal + 3D tilt */}
              {feed.items.length === 0 ? (
                <p className="mono-label mt-16 text-center">
                  No frames in {activeWorld ? activeWorld.name : 'this world'} yet — try another
                  world.
                </p>
              ) : (
                <motion.ul
                  ref={sheetRef}
                  onKeyDown={handleSheetKeyDown}
                  className="mt-8 flex list-none flex-wrap gap-2 p-0"
                  layout={!reducedMotion}
                >
                  {feed.items.map((item, index) => {
                    const photo = item.photo
                    const { width, height } = photo.metadata
                    const ratio = width > 0 && height > 0 ? width / height : 1
                    const world = photo.category
                      ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
                      : null

                    return (
                      <motion.li
                        key={photo.slug}
                        data-frame-index={index}
                        className="m-0 grow"
                        style={{
                          flexBasis: `${Math.round(ratio * 200)}px`,
                          flexGrow: Math.round(ratio * 100),
                        }}
                        layout={!reducedMotion}
                        initial={false}
                        whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: '-40px 0px' }}
                        transition={{
                          duration: 0.6,
                          delay: staggerDelay(index),
                          ease: focusEase,
                        }}
                      >
                        <button
                          type="button"
                          data-archive-trigger
                          aria-label={`Open \u201c${photo.title}\u201d in the image viewer`}
                          className="pocket-frame depth-frame archive-frame-trigger group block h-full w-full border-0 p-0 text-left"
                          style={
                            {
                              '--glow-color': world?.mood.accent ?? 'var(--accent)',
                            } as React.CSSProperties
                          }
                          onClick={(event) => {
                            lightboxTriggerRef.current = event.currentTarget
                            setActiveIndex(index)
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
                            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px"
                            priority={index < 6}
                            intrinsicWidth={width || undefined}
                            intrinsicHeight={height || undefined}
                            lqip={photo.image?.lqip}
                            hotspot={photo.image?.hotspot}
                            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                            style={{
                              aspectRatio: `${width || 1} / ${height || 1}`,
                            }}
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
                        </button>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              )}

              <p className="mono-label mt-10">Arrow keys move between frames</p>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Floating frame counter */}
      <FrameCounter total={feed.items.length} containerRef={mainRef} />
      <ArchiveLightbox
        items={feed.items}
        worlds={worlds}
        activeIndex={activeIndex}
        onIndexChange={handleLightboxIndexChange}
      />
    </main>
  )
}
