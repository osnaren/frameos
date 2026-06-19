import { Link } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="site-header px-4">
      <nav className="page-shell flex flex-wrap items-center gap-4 py-4">
        <h2 className="m-0 flex-shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[var(--ink)] no-underline shadow-[0_18px_40px_rgba(18,18,18,0.08)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-[var(--bg)]">
              FR
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-[0.24em] uppercase">FrameOS</span>
              <span className="mt-1 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--muted)]">
                Photography
              </span>
            </span>
          </Link>
        </h2>

        <div className="order-3 flex w-full flex-wrap gap-4 text-xs font-semibold tracking-[0.2em] uppercase text-[var(--muted)] sm:order-2 sm:ml-auto sm:w-auto">
          <Link
            to="/"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Home
          </Link>
          <Link
            to="/gallery"
            search={{ limit: 24 }}
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Gallery
          </Link>
          <Link
            to="/about"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            About
          </Link>
          <Link
            to="/contact"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Contact
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
