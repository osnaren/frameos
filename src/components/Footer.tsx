import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line)] px-4 py-10 text-[var(--muted)]">
      <div className="page-shell grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="mono-label">FrameOS — Pocket Worlds</p>
          <p className="display-italic mt-3 max-w-md text-xl leading-8 text-[var(--muted-strong)] sm:text-2xl">
            No studio. No heavy gear. Just a phone, a moment, and the instinct to notice.
          </p>
        </div>
        <div className="space-y-3 text-sm leading-7 lg:justify-self-end lg:text-right">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 lg:justify-end">
            <Link to="/" hash="worlds" className="no-underline hover:text-[var(--ink)]">
              Worlds
            </Link>
            <Link to="/archive" className="no-underline hover:text-[var(--ink)]">
              Index
            </Link>
            <Link to="/notes" className="no-underline hover:text-[var(--ink)]">
              Field Notes
            </Link>
            <Link to="/signal" className="no-underline hover:text-[var(--ink)]">
              Signal
            </Link>
          </nav>
          <p className="m-0 mono-label">Photographed entirely on a phone · © {year} FrameOS</p>
        </div>
      </div>
    </footer>
  )
}
