import { useRef } from 'react'

import { useGSAP } from '@gsap/react'
import { Link } from '@tanstack/react-router'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', hash: 'worlds', label: 'Worlds', note: 'Enter the collections' },
  { to: '/archive', label: 'Index', note: 'View every exposure' },
  { to: '/notes', label: 'Field Notes', note: 'Read the practice' },
  { to: '/signal', label: 'Signal', note: 'Start a conversation' },
] as const

function ApertureIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="aperture-icon">
      <circle cx="12" cy="12" r="9.25" />
      <g className="aperture-icon-blades">
        {Array.from({ length: 6 }, (_, index) => (
          <line
            key={index}
            x1="12"
            y1="4.25"
            x2="16.7"
            y2="8.35"
            transform={`rotate(${index * 60} 12 12)`}
          />
        ))}
      </g>
    </svg>
  )
}

function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      }}
      className="cinematic-footer-top"
    >
      <ApertureIcon />
      Rewind
    </button>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const footerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = footerRef.current
      if (!root) return

      const reveals = gsap.utils.toArray<HTMLElement>('[data-footer-reveal]', root)
      const railLines = gsap.utils.toArray<HTMLElement>('.cinematic-footer-rail i', root)
      const railLabels = gsap.utils.toArray<HTMLElement>('.cinematic-footer-rail span', root)
      const slash = root.querySelector<HTMLElement>('.cinematic-footer-wordmark-slash')
      const credits = gsap.utils.toArray<HTMLElement>('[data-footer-credit]', root)
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reducedMotion) {
        gsap.set([...reveals, ...railLines, ...railLabels, ...credits, slash], {
          clearProps: 'all',
        })
        return
      }

      gsap.set(reveals, { yPercent: 115, filter: 'blur(10px)', autoAlpha: 0 })
      gsap.set(railLines, { scaleX: 0, transformOrigin: 'center' })
      gsap.set(railLabels, { y: 8, autoAlpha: 0 })
      gsap.set(slash, { scaleY: 0, transformOrigin: 'bottom', autoAlpha: 0 })
      gsap.set(credits, { y: 12, autoAlpha: 0 })

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          observer.disconnect()

          const timeline = gsap.timeline({ defaults: { ease: 'expo.out' } })
          timeline
            .to(railLines, { scaleX: 1, duration: 1.1, stagger: 0.08 })
            .to(railLabels, { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.08 }, '<0.1')
            .to(
              reveals,
              {
                yPercent: 0,
                filter: 'blur(0px)',
                autoAlpha: 1,
                duration: 1.15,
                stagger: 0.075,
                clearProps: 'transform,filter,opacity,visibility',
              },
              '-=0.72'
            )
            .to(
              slash,
              {
                scaleY: 1,
                autoAlpha: 1,
                duration: 0.9,
                clearProps: 'transform,opacity,visibility',
              },
              '<0.18'
            )
            .to(
              credits,
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.75,
                stagger: 0.08,
                clearProps: 'transform,opacity,visibility',
              },
              '-=0.58'
            )
        },
        { threshold: 0.12 }
      )

      observer.observe(root)
      return () => observer.disconnect()
    },
    { scope: footerRef }
  )

  return (
    <footer ref={footerRef} className="cinematic-footer">
      <div className="cinematic-footer-rail" aria-hidden="true">
        <span>36</span>
        <i />
        <span>FRAME / OS</span>
        <i />
        <span>∞</span>
      </div>

      <div className="page-shell cinematic-footer-inner">
        <div className="cinematic-footer-intro">
          <div className="cinematic-footer-reveal-mask">
            <p data-footer-reveal>Every photograph closes one moment and opens another.</p>
          </div>
          <Link to="/signal" className="cinematic-footer-signal" data-footer-reveal>
            Leave a signal
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <div className="cinematic-footer-wordmark" aria-label="Frame OS">
          <span className="cinematic-footer-reveal-mask">
            <span data-footer-reveal>FRAME</span>
          </span>
          <span className="cinematic-footer-wordmark-slash" aria-hidden="true">
            /
          </span>
          <span className="cinematic-footer-reveal-mask">
            <span data-footer-reveal>OS</span>
          </span>
        </div>

        <nav aria-label="Footer" className="cinematic-footer-nav">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.label}
              to={link.to}
              hash={'hash' in link ? link.hash : undefined}
              className="cinematic-footer-link"
              data-footer-reveal
            >
              <span className="cinematic-footer-link-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{link.label}</strong>
                <small>{link.note}</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="cinematic-footer-credits">
          <p data-footer-credit>FrameOS · Pocket Worlds · {year}</p>
          <p data-footer-credit>Things noticed, photographed on a phone.</p>
          <span data-footer-credit>
            <BackToTop />
          </span>
        </div>
      </div>
    </footer>
  )
}
