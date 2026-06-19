import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { Reveal } from '@/components/layout/Reveal'
import { CloudinaryImage } from '@/components/photo/CloudinaryImage'
import { getHomeViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/')({
  loader: () => getHomeViewServer(),
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            {
              title: loaderData.page.seo.title,
            },
            {
              name: 'description',
              content: loaderData.page.seo.description,
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
  component: HomeRoute,
})

function HomeRoute() {
  const data = Route.useLoaderData()!
  const hero = data.featuredItems.at(0)

  return (
    <main className="space-y-20 px-4 pt-4 sm:space-y-24">
      <section className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-stretch">
        <motion.div
          className="surface-panel relative min-h-[500px] overflow-hidden rounded-[2.5rem]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          {hero ? (
            <>
              <CloudinaryImage
                publicId={hero.imagePublicId}
                alt={hero.alt}
                preset="hero"
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,9,7,0.08),rgba(12,9,7,0.62))]" />
            </>
          ) : null}

          <div className="relative flex min-h-[500px] flex-col justify-between p-6 sm:p-10 lg:p-12">
            <div className="flex flex-wrap gap-3">
              <span className="section-label rounded-full border border-white/18 bg-black/12 px-4 py-2 text-white">
                {data.page.eyebrow}
              </span>
              {data.isDegraded ? (
                <span className="rounded-full border border-white/18 bg-black/12 px-4 py-2 text-sm text-white/88">
                  Cached snapshot
                </span>
              ) : null}
            </div>

            <div className="max-w-3xl">
              <h1 className="display-font text-5xl leading-[0.92] text-white sm:text-7xl">
                {data.page.headline}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/84 sm:text-lg">
                {data.page.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/gallery"
                  search={{ limit: 24 }}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] no-underline transition hover:-translate-y-0.5"
                >
                  Open gallery
                </Link>
                <Link
                  to="/about"
                  className="rounded-full border border-white/24 bg-white/10 px-6 py-3 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-white/14"
                >
                  Read the story
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6">
          <Reveal className="surface-panel flex flex-col justify-between rounded-[2rem] p-6 sm:p-8">
            <div>
              <p className="section-label">System</p>
              <h2 className="display-font mt-3 text-3xl leading-none text-[var(--ink)] sm:text-4xl">
                One upload flow, typed content, flexible front-end.
              </h2>
            </div>
            <div className="mt-8 space-y-5 text-sm leading-7 text-[var(--muted)]">
              <p className="m-0">
                Photos remain canonical in Cloudinary, page storytelling stays in Sanity, and the UI
                only talks to a repository contract through TanStack Start server functions.
              </p>
              <p className="m-0">
                That means new uploads can surface quickly without dragging editorial content into a
                second manual photo-entry workflow.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="surface-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-label">Selected work</p>
            <div className="mt-5 space-y-5">
              {data.featuredItems.slice(0, 3).map((item) => (
                <Link
                  key={item.imagePublicId}
                  to="/photos/$slug"
                  params={{ slug: item.photoHref.split('/').at(-1) ?? '' }}
                  className="group flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4 no-underline last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="m-0 text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-[var(--accent)]">
                      {item.location ?? 'Featured'}
                    </p>
                    <h3 className="display-font mt-2 text-2xl text-[var(--ink)] transition group-hover:text-[var(--accent)]">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-sm text-[var(--muted)]">View</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="page-shell space-y-6">
        {data.isDegraded ? (
          <StatusBanner title="Serving cached content.">
            Cloudinary or Sanity was temporarily slow, so the home page is using the last successful
            snapshot.
          </StatusBanner>
        ) : null}

        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="section-label">Featured frames</p>
              <h2 className="display-font mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
                A small edit from the current archive.
              </h2>
            </div>
            <Link
              to="/gallery"
              search={{ limit: 24 }}
              className="hidden rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--ink)] no-underline lg:inline-flex"
            >
              Browse all photographs
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {data.featuredItems.map((item, index) => (
            <Reveal key={item.imagePublicId} delay={index * 0.08}>
              <article className="surface-panel overflow-hidden rounded-[2rem]">
                <Link
                  to="/photos/$slug"
                  params={{ slug: item.photoHref.split('/').at(-1) ?? '' }}
                  className="no-underline"
                >
                  <CloudinaryImage
                    publicId={item.imagePublicId}
                    alt={item.alt}
                    preset="card"
                    priority={index === 0}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="p-6">
                  <p className="section-label">{item.location ?? 'Selected work'}</p>
                  <h3 className="display-font mt-3 text-3xl text-[var(--ink)]">{item.title}</h3>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-shell pb-8">
        <Reveal className="surface-panel overflow-hidden rounded-[2.5rem] p-8 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="section-label">Why this setup</p>
              <h2 className="display-font mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
                The front-end can be redesigned later without tearing up the archive.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
                Core content contracts, cache tags, webhook invalidation, and photo normalization
                live on the server boundary. The UI is free to change shape because the data model
                stays consistent underneath it.
              </p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-[var(--muted)]">
              <p className="m-0">Typed Sanity documents for page content and curated picks.</p>
              <p className="m-0">
                Cloudinary as the canonical source for upload, metadata, and image delivery.
              </p>
              <p className="m-0">
                TanStack Start loaders and server functions owning cache and revalidation.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
