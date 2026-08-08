import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'

import { isNavigationLinkActive, NAV_LINKS } from '@/components/navigation'

import ThemeToggle from './ThemeToggle'

const MobileNavigation = lazy(() => import('./MobileNavigation'))
const COMPACT_NAV_QUERY = '(max-width: 767px)'

function subscribeToCompactNavigation(onStoreChange: () => void) {
  const media = window.matchMedia(COMPACT_NAV_QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function getCompactNavigationSnapshot() {
  return window.matchMedia(COMPACT_NAV_QUERY).matches
}

function MobileNavigationPlaceholder() {
  return <span aria-hidden="true" className="site-mobile-menu-placeholder" />
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const compactNavigation = useSyncExternalStore(
    subscribeToCompactNavigation,
    getCompactNavigationSnapshot,
    () => false
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="site-header px-3 md:px-4" data-scrolled={scrolled}>
      <nav
        aria-label="Primary"
        className="site-header-bar page-shell flex items-center gap-3 py-3 md:gap-4 md:py-4"
      >
        <Link to="/" className="site-brand group flex shrink-0 items-center gap-3 no-underline">
          <span aria-hidden="true" className="site-brand-mark">
            <span>FO</span>
          </span>
          <span className="site-brand-copy flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase">FrameOS</span>
            <span className="mono-label mt-1 text-[0.6rem]!">Pocket Worlds</span>
          </span>
        </Link>

        <div className="site-nav-list ml-auto hidden items-center gap-x-6 text-[0.8rem] font-semibold tracking-[0.16em] uppercase md:flex">
          {NAV_LINKS.map((link, index) => {
            const isActive = isNavigationLinkActive(pathname, link.to)

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

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {compactNavigation ? (
            <Suspense fallback={<MobileNavigationPlaceholder />}>
              <MobileNavigation pathname={pathname} />
            </Suspense>
          ) : (
            <MobileNavigationPlaceholder />
          )}
        </div>
      </nav>
    </header>
  )
}
