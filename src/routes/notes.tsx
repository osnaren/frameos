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

/** A thin reading-progress bar that fills as the user scrolls through the essay. */
function ReadingProgress({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target,
    offset: ['start start', 'end start'],
  })

  if (reducedMotion) return null

  return (
    <motion.div
      className="reading-progress"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  )
}

/** Floating ambient particles that add atmospheric depth to the page. */
function AmbientParticles() {
  const particles = [
    { x: '12%', y: '18%', size: 3, delay: 0, duration: 9 },
    { x: '78%', y: '25%', size: 4, delay: 1.2, duration: 11 },
    { x: '45%', y: '55%', size: 3, delay: 2.8, duration: 8 },
    { x: '88%', y: '70%', size: 5, delay: 0.5, duration: 10 },
    { x: '22%', y: '80%', size: 3, delay: 3.2, duration: 12 },
  ]

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="ambient-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Field Notes as a visual essay with:
 * - reading progress bar
 * - floating ambient particles
 * - pull-quote with animated border
 * - staggered noticing-list reveal
 * - scroll-linked photo scale parallax
 * - contact-strip hover depth
 * - decorative golden thread divider
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
  const slowScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.97])
  const fastScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.94])

  const crossing = data.gallery.at(0)
  const column = data.gallery.slice(1)
  const slugOf = (href: string) => href.split('/').at(-1) ?? ''

  return (
    <main className="relative overflow-x-clip px-4 pt-12 pb-20">
      {/* Reading progress indicator */}
      <ReadingProgress target={essayRef} />

      {/* Atmospheric ambient particles */}
      <AmbientParticles />

      {/* A quiet green wash from the Small Wonders world opens the chapter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52vh]"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, #ecf1e2 var(--wash-strength), transparent), transparent)',
        }}
      />

      {/* Decorative radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30vh] right-0 -z-10 h-[60vh] w-[60vh] opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%)',
        }}
      />

      {/* Subtle dot grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 dot-grid-bg-soft"
      />

      <motion.div className="page-shell" initial="hidden" animate="visible" variants={contactSheet}>
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          Field Notes
        </motion.p>
        <motion.h1
          className="display-font text-balance mt-4 max-w-3xl text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] font-light text-(--ink)"
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

              {/* Pull quote */}
              <motion.blockquote
                className="pull-quote m-0 mt-8"
                initial={reducedMotion ? undefined : { opacity: 0 }}
                whileInView={reducedMotion ? undefined : { opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.span
                  aria-hidden="true"
                  className="pull-quote-line"
                  initial={reducedMotion ? false : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                The phone is the camera that is present when something worth noticing happens.
              </motion.blockquote>

              <div className="border-t border-(--line) pt-6">
                <p className="mono-label m-0">What tends to get noticed</p>
                <ul className="mt-4 list-none space-y-3 p-0">
                  {NOTICING.map((item, index) => (
                    <motion.li
                      key={item}
                      className="display-italic text-lg text-(--muted-strong)"
                      initial={reducedMotion ? undefined : { opacity: 0, x: -12 }}
                      whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <span
                        className="mr-2 inline-block h-px w-4 align-middle"
                        style={{ background: 'var(--accent)' }}
                      />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Golden thread divider */}
              <div className="golden-thread my-6" aria-hidden="true" />

              <p className="m-0 text-sm leading-7 text-(--muted)">
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
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          y: index % 2 === 0 ? slowY : fastY,
                          scale: index % 2 === 0 ? slowScale : fastScale,
                        }
                  }
                >
                  <Link
                    to="/photos/$slug"
                    params={{ slug: slugOf(item.photoHref) }}
                    className="pocket-frame depth-frame group block no-underline"
                  >
                    <PhotoImage
                      publicId={item.imagePublicId}
                      alt={item.alt}
                      preset="card"
                      sizes="(max-width: 1024px) 92vw, 420px"
                      className="h-auto w-full transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
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
            <Link
              to="/archive"
              className="link-glow px-2 py-2 text-sm font-semibold text-(--muted-strong)"
            >
              See every frame →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {data.gallery.map((item) => (
              <Link
                key={`strip-${item.imagePublicId}`}
                to="/photos/$slug"
                params={{ slug: slugOf(item.photoHref) }}
                aria-label={`View \u201c${item.title}\u201d`}
                className="pocket-frame contact-strip-item block w-24 no-underline sm:w-32"
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
            className="rounded-full bg-(--ink) px-6 py-3.5 text-sm font-semibold text-(--bg) no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Step into the worlds
          </Link>
          <Link
            to="/signal"
            className="rounded-full border border-(--line) bg-(--panel) px-6 py-3.5 text-sm font-semibold text-(--ink) no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
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
