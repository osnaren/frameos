import { Link, createFileRoute } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { Reveal } from '@/components/layout/Reveal'
import { PhotoMasonry } from '@/components/photo/PhotoMasonry'
import { buildCanonicalGallerySearch, validateGallerySearch } from '@/lib/gallery-search'
import { getGalleryFeedServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/gallery')({
  validateSearch: (search) => validateGallerySearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getGalleryFeedServer({ data: deps }),
  staleTime: 30_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            {
              title: 'Gallery | FrameOS',
            },
            {
              name: 'description',
              content: 'Browse the public gallery by category, series, or tag.',
            },
            {
              name: 'robots',
              content: loaderData.robots,
            },
          ],
          links: [
            {
              rel: 'canonical',
              href: loaderData.canonicalUrl,
            },
          ],
        }
      : {},
  component: GalleryRoute,
})

function GalleryRoute() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()

  return (
    <main className="space-y-10 px-4 pt-8">
      <section className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Reveal className="surface-panel rounded-[2.25rem] p-8 sm:p-10">
          <p className="section-label">Gallery</p>
          <h1 className="display-font mt-4 text-5xl leading-[0.94] text-[var(--ink)] sm:text-6xl">
            Public photographs, filtered from a typed photo archive.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">
            Cursor pagination, Cloudinary delivery, and publication guards all live underneath this
            view so the UI can keep changing later without changing the content model.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="surface-panel rounded-[2.25rem] p-6">
          <form action="/gallery" method="get" className="space-y-4">
            <div>
              <label
                htmlFor="category"
                className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]"
              >
                Category
              </label>
              <input
                id="category"
                name="category"
                defaultValue={search.category ?? ''}
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="series"
                className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]"
              >
                Series
              </label>
              <input
                id="series"
                name="series"
                defaultValue={search.series ?? ''}
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="tag"
                className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]"
              >
                Tag
              </label>
              <input
                id="tag"
                name="tag"
                defaultValue={search.tag ?? ''}
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
              />
            </div>
            <input type="hidden" name="limit" value={search.limit} />
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--bg)]"
              >
                Apply filters
              </button>
              <Link
                to="/gallery"
                search={{ limit: search.limit }}
                className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--ink)] no-underline"
              >
                Clear
              </Link>
            </div>
          </form>
        </Reveal>
      </section>

      <section className="page-shell space-y-6 pb-8">
        {data.isDegraded ? (
          <StatusBanner title="Serving cached content.">
            Cloudinary was temporarily unavailable, so the gallery is showing the last successful
            snapshot.
          </StatusBanner>
        ) : null}

        {data.errorMessage ? (
          <div className="surface-panel rounded-[2rem] px-6 py-5 text-sm text-[var(--muted)]">
            {data.errorMessage}
          </div>
        ) : null}

        {data.items.length > 0 ? (
          <PhotoMasonry items={data.items} />
        ) : (
          <div className="surface-panel rounded-[2rem] px-6 py-10 text-center text-[var(--muted)]">
            No published photographs matched the current filters.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-sm text-[var(--muted)]">
            Canonical query: {buildCanonicalGallerySearch(search) || 'default'}
          </p>
          {data.nextCursor ? (
            <Link
              to="/gallery"
              search={{
                ...search,
                after: data.nextCursor,
              }}
              className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--ink)] no-underline"
            >
              Load next page
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  )
}
