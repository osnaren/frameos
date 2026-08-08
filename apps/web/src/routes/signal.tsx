import { useEffect, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, Copy } from 'lucide-react'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PhotoImage } from '@/components/photo/PhotoImage'
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

type CopyState = 'idle' | 'copied' | 'failed'

function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), 2400)
    return () => window.clearTimeout(timer)
  }, [state])

  const label =
    state === 'copied' ? 'Address copied' : state === 'failed' ? 'Copy failed' : 'Copy address'

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          .writeText(email)
          .then(() => setState('copied'))
          .catch(() => setState('failed'))
      }}
      className="signal-copy"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {state === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {label}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? `${email} copied to the clipboard`
          : state === 'failed'
            ? `Could not copy ${email}. Select the address instead.`
            : ''}
      </span>
    </button>
  )
}

function SignalRoute() {
  const data = Route.useLoaderData()!
  const reducedMotion = useReducedMotion()
  const email = data.page.email
  const socials = data.page.socials.filter((social) => !social.href.startsWith('mailto:'))

  return (
    <main className="signal-page">
      <div className="signal-cinema" aria-hidden="true">
        <PhotoImage
          publicId="local/the-sea"
          alt=""
          preset="hero"
          sizes="100vw"
          priority
          className="signal-cinema-image"
        />
        <div className="signal-cinema-shade" />
      </div>

      <motion.div
        className="page-shell signal-layout"
        initial="hidden"
        animate="visible"
        variants={contactSheet}
      >
        <motion.div className="signal-heading" variants={revealVariants(reducedMotion)}>
          <p className="signal-channel">Open channel · personal correspondence</p>
          <h1>{data.page.headline}</h1>
        </motion.div>

        <motion.div className="signal-transmission" variants={revealVariants(reducedMotion)}>
          <div className="signal-transmission-line" aria-hidden="true">
            <span />
          </div>
          <div className="signal-copy-block">
            {data.page.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          {email ? (
            <div className="signal-address-block">
              <span>Transmit to</span>
              <a href={`mailto:${email}`} className="signal-address">
                {email}
                <ArrowUpRight aria-hidden="true" />
              </a>
              <CopyEmailButton email={email} />
            </div>
          ) : null}

          {socials.length > 0 ? (
            <nav aria-label="Elsewhere" className="signal-socials">
              {socials.map((social) => (
                <a key={social.href} href={social.href} rel="noreferrer" target="_blank">
                  {social.label}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              ))}
            </nav>
          ) : null}

          {data.isDegraded ? (
            <StatusBanner title="Serving cached content.">
              This page is showing its last successful snapshot.
            </StatusBanner>
          ) : null}
        </motion.div>

        <motion.div className="signal-footerline" variants={revealVariants(reducedMotion)}>
          <span>FrameOS / Signal</span>
          <span>Replies arrive by email</span>
        </motion.div>
      </motion.div>
    </main>
  )
}
