import { useEffect, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, Copy } from 'lucide-react'

import { StatusBanner } from '@/components/content/StatusBanner'
import { SignalSkeleton } from '@/components/layout/RouteSkeletons'
import { PhotoImage } from '@/components/photo/PhotoImage'
import { buildSeoHead } from '@/lib/seo'
import { getContactViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/signal')({
  loader: () => getContactViewServer(),
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
  pendingComponent: SignalSkeleton,
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
        if (!('clipboard' in navigator)) {
          setState('failed')
          return
        }
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

function delay(ms: number) {
  return { '--enter-delay': `${ms}ms` } as React.CSSProperties
}

function SignalRoute() {
  const data = Route.useLoaderData()
  const email = data.page.email
  const socials = data.page.socials.filter((social) => !social.href.startsWith('mailto:'))
  // The backdrop is the site's own share image (Site Settings → SEO image),
  // so it changes with the content rather than being pinned to one file.
  const backdrop = data.site.seo.imagePublicId

  return (
    <main className="signal-page">
      <div className="signal-cinema" aria-hidden="true">
        {backdrop ? (
          <PhotoImage
            publicId={backdrop}
            alt=""
            preset="hero"
            sizes="100vw"
            priority
            className="signal-cinema-image"
          />
        ) : null}
        <div className="signal-cinema-shade" />
      </div>

      <div className="page-shell signal-layout">
        <div className="signal-heading enter-focus">
          <p className="signal-channel">Open channel · personal correspondence</p>
          <h1>{data.page.headline}</h1>
        </div>

        <div className="signal-transmission enter-focus" style={delay(140)}>
          <div className="signal-transmission-meta" aria-hidden="true">
            <span>Receiver 01</span>
            <span>Channel open</span>
          </div>
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
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </nav>
          ) : null}

          {data.isDegraded ? (
            <StatusBanner title="Serving cached content.">
              This page is showing its last successful snapshot.
            </StatusBanner>
          ) : null}
        </div>

        <div className="signal-footerline enter-focus" style={delay(260)}>
          <Link to="/archive">Keep looking — open the Index</Link>
          <span>Replies arrive by email</span>
        </div>
      </div>
    </main>
  )
}
