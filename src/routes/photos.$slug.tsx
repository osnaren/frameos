import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { getWorld } from '@/content/worlds'
import { getGalleryFeedServer, getPhotoDetailServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/photos/$slug')({
  loader: async ({ params }) => {
    const detail = await getPhotoDetailServer({ data: { slug: params.slug } })
    const photo = detail!.photo
    const feed = photo.category
      ? await getGalleryFeedServer({ data: { category: photo.category, limit: 48 } })
      : null
    const siblings = feed?.items.map((item) => item.photo.slug) ?? []
    const position = siblings.indexOf(photo.slug)

    return {
      detail: detail!,
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
      className="mono-label cursor-pointer rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 hover:border-[var(--accent)]"
    >
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  )
}

function PhotoDetailRoute() {
  const { detail, siblings, position } = Route.useLoaderData()
  const navigate = useNavigate()
  const photo = detail.photo
  const world = photo.category ? getWorld(photo.category) : null
  const previousSlug = position > 0 ? siblings[position - 1] : null
  const nextSlug = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null
  const washColor = photo.metadata.palette?.[0]

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
        <nav
          aria-label="Photograph context"
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          {world ? (
            <Link
              to="/worlds/$world"
              params={{ world: world.slug }}
              className="mono-label no-underline hover:text-[var(--ink)]"
            >
              ← {world.name}
            </Link>
          ) : null}
          <Link to="/archive" className="mono-label no-underline hover:text-[var(--ink)]">
            Index
          </Link>
          {position >= 0 ? (
            <span className="mono-label ml-auto">
              frame {String(position + 1).padStart(2, '0')} /{' '}
              {String(siblings.length).padStart(2, '0')}
            </span>
          ) : null}
        </nav>

        <figure className="m-0 mt-6">
          <div
            className="pocket-frame mx-auto w-fit max-w-full"
            style={{ viewTransitionName: `photo-${photo.slug.replace(/[^a-z0-9-]/gi, '')}` }}
          >
            <PhotoImage
              publicId={photo.publicId}
              alt={photo.alt}
              preset="detail"
              priority
              sizes="(max-width: 1024px) 100vw, 76vw"
              className="mx-auto h-auto max-h-[76svh] w-auto max-w-full"
            />
          </div>

          <figcaption className="mx-auto mt-8 max-w-2xl text-center">
            <h1 className="display-font text-3xl leading-tight font-light text-[var(--ink)] sm:text-4xl">
              {photo.title}
            </h1>
            {photo.caption ? (
              <p className="display-italic mt-3 text-lg leading-8 text-[var(--muted-strong)]">
                {photo.caption}
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
          </figcaption>
        </figure>

        <nav
          aria-label="Previous and next photographs"
          className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-6"
        >
          {previousSlug ? (
            <Link
              to="/photos/$slug"
              params={{ slug: previousSlug }}
              className="text-sm font-semibold text-[var(--muted-strong)] no-underline hover:text-[var(--ink)]"
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
              className="text-sm font-semibold text-[var(--muted-strong)] no-underline hover:text-[var(--ink)]"
            >
              Next →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>

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
