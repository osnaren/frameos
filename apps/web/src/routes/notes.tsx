import { useRef } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useScroll } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { StatusBanner } from '@/components/content/StatusBanner'
import { NotesSkeleton } from '@/components/layout/RouteSkeletons'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { useHydratedReducedMotion } from '@/lib/motion'
import { buildSeoHead } from '@/lib/seo'
import { getAboutViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/notes')({
  loader: () => getAboutViewServer(),
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData
      ? buildSeoHead({
          title: loaderData.page.seo.title,
          description: loaderData.page.seo.description,
          canonicalUrl: loaderData.canonicalUrl,
          image: loaderData.shareImage,
        })
      : {},
  pendingComponent: NotesSkeleton,
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
  const reducedMotion = useHydratedReducedMotion()
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })

  if (reducedMotion) return null
  return <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} />
}

function delay(ms: number) {
  return { '--enter-delay': `${ms}ms` } as React.CSSProperties
}

/**
 * Field Notes. Reveals are CSS: the hero settles in from the first painted
 * frame and later sections reveal as they scroll into view (where the
 * browser supports scroll-driven animation) — nothing waits on hydration,
 * so there is never an invisible heading or a blank band on first paint.
 */
function FieldNotesRoute() {
  const data = Route.useLoaderData()
  const pageRef = useRef<HTMLElement>(null)
  const lead = data.gallery.at(0)
  const stills = data.gallery.slice(1)
  const slugOf = (href: string) => href.split('/').at(-1) ?? ''

  return (
    <main ref={pageRef} className="field-notes-page">
      <ReadingProgress target={pageRef} />

      <header className="page-shell field-notes-hero">
        <div className="field-notes-title enter-focus">
          <p>Field Notes · an essay on attention</p>
          <h1>{data.page.headline}</h1>
        </div>
        <aside className="field-notes-intro enter-focus" style={delay(120)}>
          <p>
            A small manifesto for carrying less, looking longer, and letting the camera arrive after
            the moment has already asked to be seen.
          </p>
          <a href="#essay">
            Read the note
            <ArrowDownRight aria-hidden="true" />
          </a>
        </aside>
      </header>

      {lead ? (
        <figure className="field-notes-lead">
          <Link to="/photos/$slug" params={{ slug: slugOf(lead.photoHref) }}>
            <PhotoImage
              publicId={lead.imagePublicId}
              alt={lead.alt}
              preset="hero"
              sizes="(max-width: 1536px) calc(100vw - 2rem), 1536px"
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
        </figure>
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

        <article className="field-notes-copy">
          {data.page.body.map((paragraph, index) => (
            <p key={paragraph.slice(0, 32)} className="reveal-on-scroll">
              {index === 0 ? (
                <span className="field-notes-dropcap">{paragraph.charAt(0)}</span>
              ) : null}
              {index === 0 ? paragraph.slice(1) : paragraph}
            </p>
          ))}

          <blockquote className="reveal-on-scroll">
            The phone is the camera that is present when something worth noticing happens.
          </blockquote>
        </article>
      </section>

      <section className="page-shell field-notes-observations" aria-labelledby="noticing-heading">
        <div>
          <p>Recurring subjects</p>
          <h2 id="noticing-heading">What keeps asking to be photographed.</h2>
        </div>
        <ol>
          {NOTICING.map((item, index) => (
            <li key={item} className="reveal-on-scroll">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <em>{item}</em>
            </li>
          ))}
        </ol>
      </section>

      {stills.length > 0 ? (
        <section className="field-notes-stills" aria-label="Selected field notes">
          {stills.map((item, index) => (
            <figure
              key={item.imagePublicId}
              className={`reveal-on-scroll ${
                index % 2 === 1
                  ? 'field-notes-still field-notes-still--offset'
                  : 'field-notes-still'
              }`}
            >
              <Link to="/photos/$slug" params={{ slug: slugOf(item.photoHref) }}>
                <PhotoImage
                  publicId={item.imagePublicId}
                  alt={item.alt}
                  preset="card"
                  sizes="(max-width: 540px) calc(100vw - 2rem), (max-width: 780px) 82vw, min(68vw, 62rem)"
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
            </figure>
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
          <Link to="/" hash="worlds">
            Wander the worlds
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
