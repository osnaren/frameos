import { Link, createFileRoute } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { Reveal } from '@/components/layout/Reveal'
import { CloudinaryImage } from '@/components/photo/CloudinaryImage'
import { getPhotoDetailServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/photos/$slug')({
  loader: ({ params }) => getPhotoDetailServer({ data: { slug: params.slug } }),
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            {
              title: `${loaderData.photo.title} | FrameOS`,
            },
            {
              name: 'description',
              content: loaderData.photo.caption ?? loaderData.photo.alt,
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
  component: PhotoDetailRoute,
})

function PhotoDetailRoute() {
  const data = Route.useLoaderData()!
  const photo = data.photo

  return (
    <main className="space-y-10 px-4 pt-8 pb-12">
      <section className="page-shell grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <Reveal className="surface-panel overflow-hidden rounded-[2.5rem]">
          <CloudinaryImage
            publicId={photo.publicId}
            alt={photo.alt}
            preset="detail"
            priority
            className="h-full w-full object-cover"
          />
        </Reveal>

        <Reveal delay={0.08} className="surface-panel rounded-[2.25rem] p-8">
          <p className="section-label">{photo.category ?? 'Photograph'}</p>
          <h1 className="display-font mt-4 text-5xl leading-[0.94] text-[var(--ink)]">
            {photo.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--muted)]">
            {photo.caption ?? photo.alt}
          </p>

          <dl className="metadata-list mt-8 grid gap-5 border-t border-[var(--line)] pt-6">
            <div>
              <dt>Location</dt>
              <dd>{photo.locationLabel ?? 'Not specified'}</dd>
            </div>
            <div>
              <dt>Capture date</dt>
              <dd>{photo.captureDate?.slice(0, 10) ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Camera</dt>
              <dd>{photo.metadata.camera ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Lens</dt>
              <dd>{photo.metadata.lens ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Exposure</dt>
              <dd>
                {[photo.metadata.aperture, photo.metadata.shutterSpeed, photo.metadata.iso]
                  .filter(Boolean)
                  .join(' · ') || 'Unknown'}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/gallery"
              search={{ limit: 24 }}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--bg)] no-underline"
            >
              Back to gallery
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--ink)] no-underline"
            >
              Ask about commissions
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="page-shell">
        {data.isDegraded ? (
          <StatusBanner title="Serving cached content.">
            This photograph is showing the last successful snapshot while Cloudinary refreshes.
          </StatusBanner>
        ) : null}
      </section>
    </main>
  )
}
