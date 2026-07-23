import { useEffect, useRef, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { contactSheet, revealVariants } from '@/lib/motion'
import { getContactViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/signal')({
  loader: () => getContactViewServer(),
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
  component: SignalRoute,
})

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(email).then(() => setCopied(true))
      }}
      className="mono-label cursor-pointer rounded-full border border-(--line) bg-(--panel) px-5 py-3 transition-all duration-300 hover:border-(--accent) hover:bg-(--panel-strong) hover:shadow-md focus-visible:border-(--accent) focus-visible:bg-(--panel-strong)"
    >
      <span>{copied ? 'Address copied' : 'Copy address'}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? `${email} copied to the clipboard` : ''}
      </span>
    </button>
  )
}

/** Animated concentric signal waves that emanate from the page centre. */
function SignalWaves() {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div className="relative h-100 w-100">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="signal-wave-ring"
            style={{ inset: 0, animationDelay: `${i * 0.7}s` }}
          />
        ))}
        <div
          className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'var(--world-accent)' }}
        />
      </div>
    </div>
  )
}

/** Floating ambient particles for atmospheric depth. */
function SignalParticles() {
  const particles = [
    { x: '15%', y: '20%', size: 3, delay: 0, duration: 10 },
    { x: '82%', y: '30%', size: 4, delay: 1.5, duration: 9 },
    { x: '35%', y: '75%', size: 3, delay: 3.0, duration: 11 },
    { x: '70%', y: '65%', size: 5, delay: 0.8, duration: 8 },
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

/** Constellation connecting lines between social links. */
function ConstellationLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLUListElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (reducedMotion || links.length < 2) {
    return (
      <ul className="mt-10 flex list-none flex-wrap gap-6 border-t border-(--line) p-0 pt-6">
        {links.map((social) => (
          <li key={social.href}>
            <a
              href={social.href}
              className="social-link mono-label"
              rel="noreferrer"
              target="_blank"
            >
              {social.label}
              <span className="text-[0.6rem] opacity-50">\u2197</span>
            </a>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="relative mt-10 border-t border-(--line) pt-6">
      <ul ref={containerRef} className="flex list-none flex-wrap gap-6 p-0">
        {links.map((social, i) => (
          <motion.li
            key={social.href}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href={social.href}
              className="social-link mono-label"
              rel="noreferrer"
              target="_blank"
            >
              {social.label}
              <span className="text-[0.6rem] opacity-50">\u2197</span>
            </a>
          </motion.li>
        ))}
      </ul>
      {/* Constellation connector lines */}
      {links.length >= 2 && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-visible"
        >
          {links.slice(0, -1).map((_, i) => (
            <line
              key={i}
              className={`constellation-line ${visible ? 'is-visible' : ''}`}
              x1={`${15 + i * 22}%`}
              y1="20"
              x2={`${37 + i * 22}%`}
              y2="20"
              style={{ transitionDelay: `${i * 200 + 500}ms` }}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

function SignalRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()
  const email = data.page.email
  const socials = data.page.socials.filter((s) => !s.href.startsWith('mailto:'))

  return (
    <main
      className="relative flex min-h-[70svh] items-center overflow-x-clip px-4 py-16"
      style={{ '--world-accent': '#4d7a38' } as React.CSSProperties}
    >
      {/* Atmospheric background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: `
            radial-gradient(800px 600px at 50% 40%, color-mix(in srgb, var(--world-accent) 8%, transparent), transparent 60%),
            radial-gradient(500px 400px at 20% 70%, color-mix(in srgb, var(--mist) 40%, transparent), transparent 50%),
            radial-gradient(400px 300px at 80% 25%, color-mix(in srgb, var(--world-accent) 5%, transparent), transparent 45%)
          `,
        }}
      />

      {/* Subtle dot grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 dot-grid-bg-soft"
      />

      {/* Signal wave animation */}
      <SignalWaves />

      {/* Floating particles */}
      <SignalParticles />

      <motion.div
        className="page-shell relative max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={contactSheet}
      >
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          Signal
        </motion.p>
        <motion.h1
          className="display-font mt-4 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.04] font-light text-(--ink)"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.headline}
        </motion.h1>

        <motion.div
          className="mt-6 space-y-4 text-base leading-8 text-(--muted-strong)"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="m-0">
              {paragraph}
            </p>
          ))}
        </motion.div>

        {/* Pull quote highlight */}
        <motion.blockquote
          className="pull-quote mt-8 max-w-md"
          variants={revealVariants(reducedMotion)}
        >
          If one of these frames reminded you of a place, a meal, or an afternoon \u2014 write and
          say so.
        </motion.blockquote>

        {email ? (
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            variants={revealVariants(reducedMotion)}
          >
            <a
              href={`mailto:${email}`}
              className="signal-pulse rounded-full bg-(--ink) px-7 py-3.5 text-sm font-semibold text-(--bg) no-underline transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Write to {email}
            </a>
            <CopyEmailButton email={email} />
          </motion.div>
        ) : null}

        {socials.length > 0 ? <ConstellationLinks links={socials} /> : null}

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
