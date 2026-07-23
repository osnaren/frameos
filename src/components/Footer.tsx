import { useEffect, useRef, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { useReducedMotion } from 'framer-motion'

import { pocketWorldJourney } from '@/content/pocket-worlds-journey'

/** An SVG light thread that draws itself when the footer enters the viewport. */
function FooterThread() {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(Boolean(reducedMotion))

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }

    const el = ref.current
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
  }, [reducedMotion])

  return (
    <div ref={ref} className={`footer-thread ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,40 C200,10 400,70 600,35 C800,0 1000,60 1200,30" />
      </svg>
    </div>
  )
}

function Keyframe({ scene }: { scene: (typeof pocketWorldJourney)[number] }) {
  return (
    <Link
      to="/worlds/$world"
      params={{ world: scene.worldSlug }}
      aria-label={`Enter ${scene.label}`}
      className="pocket-frame footer-keyframe group block w-28 shrink-0 no-underline sm:w-36"
    >
      <img
        src={scene.fallbackImage}
        srcSet={scene.fallbackSrcSet}
        alt=""
        sizes="144px"
        className="h-auto w-full rounded-lg"
        loading="lazy"
      />
      <span className="frame-corners" aria-hidden="true" />
    </Link>
  )
}

/** A looping reel of keyframes. The duplicate reel is visual only, not a second tab sequence. */
function KeyframeStrip() {
  const stripRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(Boolean(reducedMotion))

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }

    const el = stripRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div
      ref={stripRef}
      className="footer-reel mt-8 overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(12px)',
      }}
      aria-label="Pocket Worlds keyframes"
    >
      <div className="scroll-strip-track">
        <div className="scroll-strip-group">
          {pocketWorldJourney.map((scene) => (
            <Keyframe key={scene.id} scene={scene} />
          ))}
        </div>
        <div className="scroll-strip-group" aria-hidden="true">
          {pocketWorldJourney.map((scene) => (
            <div
              key={`echo-${scene.id}`}
              className="pocket-frame footer-keyframe w-28 shrink-0 sm:w-36"
            >
              <img
                src={scene.fallbackImage}
                srcSet={scene.fallbackSrcSet}
                alt=""
                sizes="144px"
                className="h-auto w-full rounded-lg"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const NAV_LINKS = [
  { to: '/', hash: 'worlds', label: 'Worlds' },
  { to: '/archive', label: 'Index' },
  { to: '/notes', label: 'Field Notes' },
  { to: '/signal', label: 'Signal' },
] as const

export default function Footer() {
  const year = new Date().getFullYear()
  const reducedMotion = useReducedMotion()
  const [linksVisible, setLinksVisible] = useState(Boolean(reducedMotion))
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reducedMotion) {
      setLinksVisible(true)
      return
    }

    const el = navRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLinksVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <footer className="site-footer border-t border-(--line) px-4 pb-10 pt-6 text-(--muted)">
      <FooterThread />
      <KeyframeStrip />

      <div className="page-shell mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="footer-brand-statement">An archive of noticing.</p>
          <p className="mono-label mt-4">FrameOS · Pocket Worlds · {year}</p>
        </div>

        <div className="space-y-4 text-[0.95rem] leading-7 lg:justify-self-end lg:text-right">
          <nav
            ref={navRef}
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-2 lg:justify-end"
          >
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.label}
                to={link.to}
                hash={'hash' in link ? link.hash : undefined}
                className="link-glow no-underline transition-all duration-300 hover:text-(--ink)"
                style={{
                  opacity: linksVisible ? 1 : 0,
                  transform: linksVisible ? 'none' : 'translateY(8px)',
                  transitionDelay: reducedMotion ? '0ms' : `${index * 80}ms`,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="golden-thread my-3" aria-hidden="true" />
          <p className="mono-label m-0 text-[0.6rem]! tracking-[0.18em]!">
            Things I noticed, photographed on a phone.
          </p>
        </div>
      </div>
    </footer>
  )
}
