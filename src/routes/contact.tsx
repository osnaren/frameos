import { createFileRoute } from '@tanstack/react-router'

import { ProseBlocks } from '@/components/content/ProseBlocks'
import { StatusBanner } from '@/components/content/StatusBanner'
import { Reveal } from '@/components/layout/Reveal'
import { getContactViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/contact')({
  loader: () => getContactViewServer(),
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
  component: ContactRoute,
})

function ContactRoute() {
  const data = Route.useLoaderData()!

  return (
    <main className="space-y-12 px-4 pt-8">
      <section className="page-shell grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Reveal className="surface-panel rounded-[2.25rem] p-8 sm:p-10">
          <p className="section-label">Contact</p>
          <h1 className="display-font mt-4 text-5xl leading-[0.94] text-[var(--ink)] sm:text-6xl">
            {data.page.headline}
          </h1>
          <div className="mt-8">
            <ProseBlocks blocks={data.page.body} />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="surface-panel rounded-[2.25rem] p-8">
          <p className="section-label">Details</p>
          <div className="mt-5 space-y-6 text-sm text-[var(--muted)]">
            <div>
              <p className="m-0 text-[0.72rem] tracking-[0.2em] uppercase">Email</p>
              <a
                href={`mailto:${data.page.email ?? data.site.email ?? 'hello@example.com'}`}
                className="mt-2 inline-flex text-lg font-semibold text-[var(--ink)] no-underline"
              >
                {data.page.email ?? data.site.email ?? 'hello@example.com'}
              </a>
            </div>
            <div>
              <p className="m-0 text-[0.72rem] tracking-[0.2em] uppercase">Social</p>
              <div className="mt-3 flex flex-col gap-3">
                {data.page.socials.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    className="text-base font-semibold text-[var(--ink)] no-underline"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="page-shell">
        {data.isDegraded ? (
          <StatusBanner title="Serving cached content.">
            The contact page is currently using the last successful snapshot while Sanity refreshes.
          </StatusBanner>
        ) : null}
      </section>
    </main>
  )
}
