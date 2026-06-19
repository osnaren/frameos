import { Link, createFileRoute } from '@tanstack/react-router'

import { ProseBlocks } from '@/components/content/ProseBlocks'
import { StatusBanner } from '@/components/content/StatusBanner'
import { Reveal } from '@/components/layout/Reveal'
import { CloudinaryImage } from '@/components/photo/CloudinaryImage'
import { getAboutViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/about')({
  loader: () => getAboutViewServer(),
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
  component: AboutRoute,
})

function AboutRoute() {
  const data = Route.useLoaderData()!

  return (
    <main className="space-y-16 px-4 pt-8 sm:space-y-20">
      <section className="page-shell grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
        <Reveal className="surface-panel rounded-[2.25rem] p-8 sm:p-10">
          <p className="section-label">About</p>
          <h1 className="display-font mt-4 text-5xl leading-[0.94] text-[var(--ink)] sm:text-6xl">
            {data.page.headline}
          </h1>
          <div className="mt-8">
            <ProseBlocks blocks={data.page.body} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/gallery"
              search={{ limit: 24 }}
              className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--bg)] no-underline"
            >
              View gallery
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-6 py-3 text-sm font-semibold text-[var(--ink)] no-underline"
            >
              Start a conversation
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="grid gap-6 sm:grid-cols-2">
          {data.gallery.slice(0, 4).map((item, index) => (
            <article
              key={item.imagePublicId}
              className={`surface-panel overflow-hidden rounded-[2rem] ${index === 0 ? 'sm:col-span-2' : ''}`}
            >
              <Link
                to="/photos/$slug"
                params={{ slug: item.photoHref.split('/').at(-1) ?? '' }}
                className="no-underline"
              >
                <CloudinaryImage
                  publicId={item.imagePublicId}
                  alt={item.alt}
                  preset={index === 0 ? 'hero' : 'card'}
                  priority={index === 0}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="p-5">
                <p className="section-label">{item.title}</p>
              </div>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="page-shell">
        {data.isDegraded ? (
          <StatusBanner title="Serving cached content.">
            The about page is currently using the last successful snapshot while Sanity refreshes.
          </StatusBanner>
        ) : null}
      </section>
    </main>
  )
}
