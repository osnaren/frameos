import { useRef } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { getPublicWorlds, getWorld } from '@/content/worlds'
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
            { title: 'Index — FrameOS Pocket Worlds' },
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

/**
 * The Index: a fast, editorial contact sheet. This is also the reduced-motion
 * presentation, the keyboard-first archive, and the fallback when the spatial
 * experience is skipped — it uses no animation library at all.
 */
function ArchiveRoute() {
  const feed = Route.useLoaderData()
  const search = Route.useSearch()
  const sheetRef = useRef<HTMLUListElement>(null)
  const worlds = getPublicWorlds()
  const activeWorld = search.world ? getWorld(search.world) : null

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
    <main className="px-4 pt-10 pb-16">
      <div className="page-shell">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
          <div>
            <p className="mono-label">
              Index · {String(feed.items.length).padStart(2, '0')} frames
              {activeWorld ? ` · ${activeWorld.name}` : ' · all worlds'}
            </p>
            <h1 className="display-font mt-3 text-4xl font-light text-[var(--ink)] sm:text-5xl">
              Every frame, on one sheet.
            </h1>
          </div>
          <Link to="/" hash="worlds" className="text-sm font-semibold text-[var(--muted-strong)]">
            Back to the worlds →
          </Link>
        </header>

        <nav aria-label="Filter by world" className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to="/archive"
            search={{}}
            aria-current={!activeWorld ? 'true' : undefined}
            className={`rounded-full border px-5 py-2.5 font-mono text-[0.78rem] tracking-[0.12em] uppercase no-underline transition-colors ${
              !activeWorld
                ? 'border-[var(--ink)] bg-[var(--ink)] !text-[var(--bg)]'
                : 'border-[var(--line)] text-[var(--muted-strong)] hover:border-[var(--ink)]'
            }`}
          >
            All
          </Link>
          {worlds.map((world) => {
            const isActive = activeWorld?.slug === world.slug

            return (
              <Link
                key={world.slug}
                to="/archive"
                search={{ world: world.slug }}
                aria-current={isActive ? 'true' : undefined}
                className={`rounded-full border px-5 py-2.5 font-mono text-[0.78rem] tracking-[0.12em] uppercase no-underline transition-colors ${
                  isActive
                    ? 'border-[var(--ink)] bg-[var(--ink)] !text-[var(--bg)]'
                    : 'border-[var(--line)] hover:border-[var(--ink)]'
                }`}
                style={{ color: isActive ? undefined : world.mood.accent }}
              >
                {world.name}
              </Link>
            )
          })}
        </nav>

        {feed.isDegraded ? (
          <div className="mt-6">
            <StatusBanner title="Serving cached content.">
              {feed.errorMessage ?? 'The index is showing its last successful snapshot.'}
            </StatusBanner>
          </div>
        ) : null}

        {/* Justified contact-sheet rows: each frame keeps its true aspect ratio */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <ul
          ref={sheetRef}
          onKeyDown={handleSheetKeyDown}
          className="mt-8 flex list-none flex-wrap gap-2 p-0"
        >
          {feed.items.map((item, index) => {
            const photo = item.photo
            const ratio = photo.metadata.width / photo.metadata.height
            const world = photo.category ? getWorld(photo.category) : null

            return (
              <li
                key={photo.slug}
                className="m-0 grow"
                style={{
                  flexBasis: `${Math.round(ratio * 200)}px`,
                  flexGrow: Math.round(ratio * 100),
                }}
              >
                <Link
                  to="/photos/$slug"
                  params={{ slug: photo.slug }}
                  aria-label={`View “${photo.title}”`}
                  className="pocket-frame group block h-full no-underline"
                  style={{
                    viewTransitionName: `photo-${photo.slug.replace(/[^a-z0-9-]/gi, '')}`,
                  }}
                >
                  <PhotoImage
                    publicId={photo.publicId}
                    alt={photo.alt}
                    preset="card"
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px"
                    priority={index < 6}
                    className="h-full w-full object-cover"
                    style={{ aspectRatio: `${photo.metadata.width} / ${photo.metadata.height}` }}
                  />
                  <span aria-hidden="true" className="frame-corners" />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <span className="truncate text-xs font-medium text-white">{photo.title}</span>
                    <span className="mono-label shrink-0 !text-white/80">
                      {world ? world.name : ''}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="mono-label mt-10">Arrow keys move between frames</p>
      </div>
    </main>
  )
}
