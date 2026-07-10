import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { contactSheet, revealVariants } from '@/lib/motion'
import { getAboutViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/notes')({
  loader: () => getAboutViewServer(),
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: loaderData.page.seo.title },
            { name: 'description', content: loaderData.page.seo.description },
          ],
          links: [{ rel: 'canonical', href: loaderData.canonicalUrl }],
        }
      : {},
  component: FieldNotesRoute,
})

const NOTICING = [
  'weather arriving before it arrives',
  'architecture older than the street around it',
  'water, in any form',
  'animals who tolerate being seen',
  'food that looks like where it came from',
]

function FieldNotesRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()

  return (
    <main className="px-4 pt-12 pb-20">
      <motion.div className="page-shell" initial="hidden" animate="visible" variants={contactSheet}>
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          Field Notes
        </motion.p>
        <motion.h1
          className="display-font mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] font-light text-[var(--ink)]"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.headline}
        </motion.h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <motion.div
            className="space-y-6 text-base leading-8 text-[var(--muted-strong)]"
            variants={revealVariants(reducedMotion)}
          >
            {data.page.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="m-0">
                {paragraph}
              </p>
            ))}

            <div className="border-t border-[var(--line)] pt-6">
              <p className="mono-label m-0">What tends to get noticed</p>
              <ul className="mt-4 list-none space-y-2 p-0">
                {NOTICING.map((item) => (
                  <li key={item} className="display-italic text-lg text-[var(--muted-strong)]">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="m-0 border-t border-[var(--line)] pt-6 text-sm leading-7 text-[var(--muted)]">
              The archive runs on a small pipeline: photographs stay canonical in one place,
              editorial words in another, and this site reads both. Portraits of people stay
              unpublished until each person has said yes.
            </p>
          </motion.div>

          <motion.aside aria-label="Selected frames" variants={revealVariants(reducedMotion)}>
            <div className="space-y-6">
              {data.gallery.map((item, index) => {
                const slug = item.photoHref.split('/').at(-1) ?? ''

                return (
                  <figure
                    key={item.imagePublicId}
                    className={`m-0 ${index === 1 ? 'sm:ml-10' : ''}`}
                  >
                    <Link
                      to="/photos/$slug"
                      params={{ slug }}
                      className="pocket-frame block no-underline"
                    >
                      <PhotoImage
                        publicId={item.imagePublicId}
                        alt={item.alt}
                        preset="card"
                        sizes="(max-width: 1024px) 92vw, 360px"
                        className="h-auto w-full"
                      />
                      <span aria-hidden="true" className="frame-corners" />
                    </Link>
                    <figcaption className="mono-label mt-2">{item.title}</figcaption>
                  </figure>
                )
              })}
            </div>
          </motion.aside>
        </div>

        <motion.div
          className="mt-16 flex flex-wrap gap-4 border-t border-[var(--line)] pt-8"
          variants={revealVariants(reducedMotion)}
        >
          <Link
            to="/"
            hash="worlds"
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--bg)] no-underline"
          >
            Step into the worlds
          </Link>
          <Link
            to="/signal"
            className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-6 py-3 text-sm font-semibold text-[var(--ink)] no-underline"
          >
            Send a signal
          </Link>
        </motion.div>

        {data.isDegraded ? (
          <div className="mt-8">
            <StatusBanner title="Serving cached content.">
              This page is showing its last successful snapshot.
            </StatusBanner>
          </div>
        ) : null}
      </motion.div>
    </main>
  )
}
