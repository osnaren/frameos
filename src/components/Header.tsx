import { Link } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="site-header px-4">
      <nav aria-label="Primary" className="page-shell flex flex-wrap items-center gap-4 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-3 no-underline">
          <span
            aria-hidden="true"
            className="flex h-9 w-7 items-center justify-center rounded-[5px] border-[1.5px] border-(--ink) text-[0.6rem] font-semibold tracking-widest"
          >
            FO
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase">FrameOS</span>
            <span className="mono-label mt-1 text-[0.6rem]!">Pocket Worlds</span>
          </span>
        </Link>

        <div className="order-3 flex w-full flex-wrap gap-x-6 gap-y-1 text-[0.8rem] font-semibold tracking-[0.16em] uppercase max-[520px]:flex-nowrap max-[520px]:gap-x-4 max-[520px]:text-[0.7rem] max-[520px]:tracking-[0.12em] sm:order-2 sm:ml-auto sm:w-auto">
          <Link
            to="/"
            className="site-nav-link"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Worlds
          </Link>
          <Link
            to="/archive"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Index
          </Link>
          <Link
            to="/notes"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Field Notes
          </Link>
          <Link
            to="/signal"
            className="site-nav-link"
            activeProps={{ className: 'site-nav-link is-active' }}
          >
            Signal
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:order-3">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
