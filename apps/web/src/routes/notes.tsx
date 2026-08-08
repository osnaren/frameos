import { useRef } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

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

function ReadingProgress({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })

  if (reducedMotion) return null
  return <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} />
}

function FieldNotesRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()
  const pageRef = useRef<HTMLElement>(null)
  const lead = data.gallery.at(0)
  const stills = data.gallery.slice(1)
  const slugOf = (href: string) => href.split('/').at(-1) ?? ''

  return (
    <main ref={pageRef} className="field-notes-page">
      <ReadingProgress target={pageRef} />

      <motion.header
        className="page-shell field-notes-hero"
        initial="hidden"
        animate="visible"
        variants={contactSheet}
      >
        <motion.div className="field-notes-title" variants={revealVariants(reducedMotion)}>
          <p>Field Notes · an essay on attention</p>
          <h1>{data.page.headline}</h1>
        </motion.div>
        <motion.aside className="field-notes-intro" variants={revealVariants(reducedMotion)}>
          <p>
            A small manifesto for carrying less, looking longer, and letting the camera arrive after
            the moment has already asked to be seen.
          </p>
          <a href="#essay">
            Read the note
            <ArrowDownRight aria-hidden="true" />
          </a>
        </motion.aside>
      </motion.header>

      {lead ? (
        <motion.figure
          className="field-notes-lead"
          initial={reducedMotion ? undefined : { clipPath: 'inset(7% 5% 7% 5%)', opacity: 0.7 }}
          animate={reducedMotion ? undefined : { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to="/photos/$slug" params={{ slug: slugOf(lead.photoHref) }}>
            <PhotoImage
              publicId={lead.imagePublicId}
              alt={lead.alt}
              preset="hero"
              sizes="100vw"
              priority
              lqip={lead.imageLqip}
              hotspot={lead.imageHotspot}
              className="field-notes-lead-image"
            />
          </Link>
          <figcaption>
            <span>Opening frame</span>
            <em>{lead.title}</em>
          </figcaption>
        </motion.figure>
      ) : null}

      <section id="essay" className="page-shell field-notes-essay">
        <aside className="field-notes-margin">
          <div>
            <span>Method</span>
            <strong>Mobile only</strong>
          </div>
          <div>
            <span>Sequence</span>
            <strong>Notice → frame → keep</strong>
          </div>
          <div>
            <span>Archive</span>
            <strong>Ongoing</strong>
          </div>
        </aside>

        <motion.article
          className="field-notes-copy"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={contactSheet}
        >
          {data.page.body.map((paragraph, index) => (
            <motion.p key={paragraph.slice(0, 32)} variants={revealVariants(reducedMotion)}>
              {index === 0 ? (
                <span className="field-notes-dropcap">{paragraph.charAt(0)}</span>
              ) : null}
              {index === 0 ? paragraph.slice(1) : paragraph}
            </motion.p>
          ))}

          <motion.blockquote variants={revealVariants(reducedMotion)}>
            The phone is the camera that is present when something worth noticing happens.
          </motion.blockquote>
        </motion.article>
      </section>

      <section className="page-shell field-notes-observations" aria-labelledby="noticing-heading">
        <div>
          <p>Recurring subjects</p>
          <h2 id="noticing-heading">What keeps asking to be photographed.</h2>
        </div>
        <ol>
          {NOTICING.map((item, index) => (
            <motion.li
              key={item}
              initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <em>{item}</em>
            </motion.li>
          ))}
        </ol>
      </section>

      {stills.length > 0 ? (
        <section className="field-notes-stills" aria-label="Selected field notes">
          {stills.map((item, index) => (
            <motion.figure
              key={item.imagePublicId}
              className={
                index % 2 === 1
                  ? 'field-notes-still field-notes-still--offset'
                  : 'field-notes-still'
              }
              initial={reducedMotion ? undefined : { opacity: 0, y: 48, filter: 'blur(8px)' }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/photos/$slug" params={{ slug: slugOf(item.photoHref) }}>
                <PhotoImage
                  publicId={item.imagePublicId}
                  alt={item.alt}
                  preset="card"
                  sizes="(max-width: 760px) 92vw, 54vw"
                  lqip={item.imageLqip}
                  hotspot={item.imageHotspot}
                  className="field-notes-still-image"
                />
              </Link>
              <figcaption>
                <span>{String(index + 2).padStart(2, '0')}</span>
                <em>{item.title}</em>
                <span>Field note</span>
              </figcaption>
            </motion.figure>
          ))}
        </section>
      ) : null}

      <section className="page-shell field-notes-closing">
        <p>The noticing came first.</p>
        <div>
          <Link to="/archive">
            Open the full index
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <Link to="/signal">
            Send a signal
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      {data.isDegraded ? (
        <div className="page-shell pb-12">
          <StatusBanner title="Serving cached content.">
            This page is showing its last successful snapshot.
          </StatusBanner>
        </div>
      ) : null}
    </main>
  )
}
