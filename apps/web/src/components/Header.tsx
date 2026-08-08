import { useEffect, useState } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { to: '/', label: 'Worlds', exact: true },
  { to: '/archive', label: 'Index' },
  { to: '/notes', label: 'Field Notes' },
  { to: '/signal', label: 'Signal' },
] as const

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="site-header px-4" data-scrolled={scrolled}>
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

        <div className="site-nav-list order-3 flex w-full flex-wrap gap-x-6 gap-y-1 text-[0.8rem] font-semibold tracking-[0.16em] uppercase max-[520px]:flex-nowrap max-[520px]:text-[0.68rem] max-[520px]:tracking-widest sm:order-2 sm:ml-auto sm:w-auto">
          {NAV_LINKS.map((link, index) => {
            const isActive =
              link.to === '/'
                ? pathname === '/' || pathname.startsWith('/worlds/')
                : link.to === '/archive'
                  ? pathname === '/archive' || pathname.startsWith('/photos/')
                  : pathname === link.to

            return (
              <Link
                key={link.label}
                to={link.to}
                viewTransition
                aria-current={isActive ? 'page' : undefined}
                className={`site-nav-link${isActive ? ' is-active' : ''}`}
              >
                <span aria-hidden="true" className="site-nav-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
