import { useEffect, useState } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'
import { Aperture, ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { to: '/', label: 'Worlds', exact: true },
  { to: '/archive', label: 'Index' },
  { to: '/notes', label: 'Field Notes' },
  { to: '/signal', label: 'Signal' },
] as const

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

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

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="site-mobile-menu-trigger rounded-full md:hidden"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                <Aperture aria-hidden="true" data-icon="inline-start" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              collisionPadding={12}
              className="mobile-nav-menu w-[min(20rem,calc(100vw-1.5rem))] p-2 md:hidden"
            >
              <DropdownMenuLabel className="mobile-nav-menu-label">
                Pocket Worlds <span>Navigate the archive</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {NAV_LINKS.map((link, index) => {
                  const isActive =
                    link.to === '/'
                      ? pathname === '/' || pathname.startsWith('/worlds/')
                      : link.to === '/archive'
                        ? pathname === '/archive' || pathname.startsWith('/photos/')
                        : pathname === link.to

                  return (
                    <DropdownMenuItem key={link.label} asChild>
                      <Link
                        to={link.to}
                        viewTransition
                        aria-current={isActive ? 'page' : undefined}
                        className="mobile-nav-menu-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{link.label}</strong>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <p className="mobile-nav-menu-foot">FrameOS · Things noticed on a phone</p>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
