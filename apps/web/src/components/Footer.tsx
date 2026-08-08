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
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reducedMotion) {
        gsap.set(reveals, { clearProps: 'all' })
        return
      }

      gsap.set(reveals, { yPercent: 110, filter: 'blur(8px)', opacity: 0 })

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          observer.disconnect()
          gsap.to(reveals, {
            yPercent: 0,
            filter: 'blur(0px)',
            opacity: 1,
            duration: 1.1,
            stagger: 0.08,
            ease: 'expo.out',
            clearProps: 'transform,filter,opacity',
          })
        },
        { threshold: 0.2 }
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
          <Link to="/signal" className="cinematic-footer-signal">
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
          <p>FrameOS · Pocket Worlds · {year}</p>
          <p>Things noticed, photographed on a phone.</p>
          <BackToTop />
        </div>
      </div>
    </footer>
  )
}
