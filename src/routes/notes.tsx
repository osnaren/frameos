import { useRef } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

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

/**
 * Field Notes as a visual essay: the statement stays pinned while frames
 * drift past at different depths, one faded photograph crosses behind the
 * text, and the chapter closes on a small contact-sheet strip.
 */
function FieldNotesRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()
  const essayRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: essayRef,
    offset: ['start end', 'end start'],
  })
  const crossingY = useTransform(scrollYProgress, [0, 1], [60, -160])
  const slowY = useTransform(scrollYProgress, [0, 1], [40, -40])
  const fastY = useTransform(scrollYProgress, [0, 1], [110, -110])

  const crossing = data.gallery.at(0)
  const column = data.gallery.slice(1)
  const slugOf = (href: string) => href.split('/').at(-1) ?? ''

  return (
    <main className="relative overflow-x-clip px-4 pt-12 pb-20">
      {/* A quiet green wash from the Small Wonders world opens the chapter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52vh]"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, #ecf1e2 var(--wash-strength), transparent), transparent)',
        }}
      />

      <motion.div className="page-shell" initial="hidden" animate="visible" variants={contactSheet}>
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          Field Notes
        </motion.p>
        <motion.h1
          className="display-font mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] font-light text-(--ink)"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.headline}
        </motion.h1>

        <div
          ref={essayRef}
          className="relative mt-14 grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
        >
          {/* One frame crosses slowly behind the reading column */}
          {crossing ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-[14%] -left-16 -z-10 hidden w-75 opacity-[0.16] lg:block"
              style={reducedMotion ? undefined : { y: crossingY }}
            >
              <PhotoImage
                publicId={crossing.imagePublicId}
                alt=""
                preset="card"
                sizes="300px"
                className="h-auto w-full rounded-xl"
              />
            </motion.div>
          ) : null}

          <motion.div variants={revealVariants(reducedMotion)}>
            <div className="space-y-6 text-base leading-8 text-(--muted-strong) lg:sticky lg:top-28">
              {data.page.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="m-0 max-w-prose">
                  {paragraph}
                </p>
              ))}

              <div className="border-t border-(--line) pt-6">
                <p className="mono-label m-0">What tends to get noticed</p>
                <ul className="mt-4 list-none space-y-2 p-0">
                  {NOTICING.map((item) => (
                    <li key={item} className="display-italic text-lg text-(--muted-strong)">
                      — {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="m-0 border-t border-(--line) pt-6 text-sm leading-7 text-(--muted)">
                The archive runs on a small pipeline: photographs stay canonical in one place,
                editorial words in another, and this site reads both. Portraits of people stay
                unpublished until each person has said yes.
              </p>
            </div>
          </motion.div>

          <motion.aside aria-label="Selected frames" variants={revealVariants(reducedMotion)}>
            <div className="flex flex-col gap-16">
              {column.map((item, index) => (
                <motion.figure
                  key={item.imagePublicId}
                  className={`m-0 ${index % 2 === 1 ? 'lg:ml-16' : 'lg:mr-10'}`}
                  style={reducedMotion ? undefined : { y: index % 2 === 0 ? slowY : fastY }}
                >
                  <Link
                    to="/photos/$slug"
                    params={{ slug: slugOf(item.photoHref) }}
                    className="pocket-frame block no-underline"
                  >
                    <PhotoImage
                      publicId={item.imagePublicId}
                      alt={item.alt}
                      preset="card"
                      sizes="(max-width: 1024px) 92vw, 420px"
                      className="h-auto w-full"
                    />
                    <span aria-hidden="true" className="frame-corners" />
                  </Link>
                  <figcaption className="mt-3 flex items-baseline gap-3">
                    <span className="mono-label shrink-0">
                      note {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="display-italic text-base text-(--muted-strong)">
                      {item.title}
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </motion.aside>
        </div>

        {/* Chapter close: a strip from the contact sheet */}
        <motion.div
          className="mt-24 border-t border-(--line) pt-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={revealVariants(reducedMotion)}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="mono-label m-0">Contact sheet</p>
            <Link to="/archive" className="px-2 py-2 text-sm font-semibold text-(--muted-strong)">
              See every frame →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {data.gallery.map((item) => (
              <Link
                key={`strip-${item.imagePublicId}`}
                to="/photos/$slug"
                params={{ slug: slugOf(item.photoHref) }}
                aria-label={`View “${item.title}”`}
                className="pocket-frame block w-24 no-underline sm:w-32"
              >
                <PhotoImage
                  publicId={item.imagePublicId}
                  alt=""
                  preset="thumb"
                  sizes="128px"
                  className="h-auto w-full"
                />
                <span aria-hidden="true" className="frame-corners" />
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-wrap gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={revealVariants(reducedMotion)}
        >
          <Link
            to="/"
            hash="worlds"
            className="rounded-full bg-(--ink) px-6 py-3.5 text-sm font-semibold text-(--bg) no-underline"
          >
            Step into the worlds
          </Link>
          <Link
            to="/signal"
            className="rounded-full border border-(--line) bg-(--panel) px-6 py-3.5 text-sm font-semibold text-(--ink) no-underline"
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
