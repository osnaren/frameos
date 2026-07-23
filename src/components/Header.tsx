import { Link } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { to: '/', label: 'Worlds', exact: true },
  { to: '/archive', label: 'Index' },
  { to: '/notes', label: 'Field Notes' },
  { to: '/signal', label: 'Signal' },
] as const

export default function Header() {
  return (
    <header className="site-header px-4">
      <nav aria-label="Primary" className="page-shell flex flex-wrap items-center gap-4 py-4">
        <Link to="/" className="site-brand group flex shrink-0 items-center gap-3 no-underline">
          <span aria-hidden="true" className="site-brand-mark">
            <span>FO</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase">FrameOS</span>
            <span className="mono-label mt-1 text-[0.6rem]!">Pocket Worlds</span>
          </span>
        </Link>

        <div className="order-3 flex w-full flex-wrap gap-x-6 gap-y-1 text-[0.8rem] font-semibold tracking-[0.16em] uppercase max-[520px]:flex-nowrap max-[520px]:justify-between max-[520px]:gap-x-3 max-[520px]:text-[0.68rem] max-[520px]:tracking-widest sm:order-2 sm:ml-auto sm:w-auto">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.label}
              to={link.to}
              className="site-nav-link"
              activeOptions={'exact' in link ? { exact: link.exact } : undefined}
              activeProps={{ className: 'site-nav-link is-active' }}
            >
              <span aria-hidden="true" className="site-nav-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
