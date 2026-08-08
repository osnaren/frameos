import { useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Aperture, ArrowUpRight } from 'lucide-react'

import { isNavigationLinkActive, NAV_LINKS } from '@/components/navigation'
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

export default function MobileNavigation({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
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
            const isActive = isNavigationLinkActive(pathname, link.to)

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
  )
}
