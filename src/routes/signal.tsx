import { createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

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
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(email).then(() => setCopied(true))
      }}
      className="mono-label cursor-pointer rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 py-3 hover:border-[var(--accent)]"
    >
      {copied ? 'Address copied' : 'Copy address'}
    </button>
  )
}

function SignalRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()
  const email = data.page.email

  return (
    <main className="flex min-h-[70svh] items-center px-4 py-16">
      <motion.div
        className="page-shell max-w-3xl"
        initial="hidden"
        animate="visible"
        variants={contactSheet}
      >
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          Signal
        </motion.p>
        <motion.h1
          className="display-font mt-4 text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.04] font-light text-[var(--ink)]"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.headline}
        </motion.h1>

        <motion.div
          className="mt-6 space-y-4 text-base leading-8 text-[var(--muted-strong)]"
          variants={revealVariants(reducedMotion)}
        >
          {data.page.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="m-0">
              {paragraph}
            </p>
          ))}
        </motion.div>

        {email ? (
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            variants={revealVariants(reducedMotion)}
          >
            <a
              href={`mailto:${email}`}
              className="rounded-full bg-[var(--ink)] px-7 py-3.5 text-sm font-semibold text-[var(--bg)] no-underline hover:-translate-y-0.5"
            >
              Write to {email}
            </a>
            <CopyEmailButton email={email} />
          </motion.div>
        ) : null}

        {data.page.socials.length > 0 ? (
          <motion.ul
            className="mt-10 flex list-none flex-wrap gap-5 border-t border-[var(--line)] p-0 pt-6"
            variants={revealVariants(reducedMotion)}
          >
            {data.page.socials
              .filter((social) => !social.href.startsWith('mailto:'))
              .map((social) => (
                <li key={social.href}>
                  <a href={social.href} className="mono-label" rel="noreferrer" target="_blank">
                    {social.label} ↗
                  </a>
                </li>
              ))}
          </motion.ul>
        ) : null}

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
