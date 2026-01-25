import Logo from '@components/logo/Logo';
import { Link, useLocation } from 'react-router-dom';

import ThemeToggle from '../theme/ThemeToggle';
import { FullScreenMenu, MenuButton } from './Menu';

export default function Header() {
  const location = useLocation();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="mx-auto h-16 max-w-7xl">
        <nav className="relative px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className={`text-2xl font-bold ${
                location.pathname === '/' ? 'text-primary' : 'text-[var(--color-text)]'
              } hover-accent transition-colors`}
            >
              <Logo />
            </Link>

            {/* Navigation */}
            <div className="flex items-center space-x-4 md:space-x-8">
              <ThemeToggle />
              <MenuButton aria-expanded="false" aria-controls="fullscreen-menu" />
            </div>
          </div>
        </nav>
      </div>
      <FullScreenMenu />
    </header>
  );
}
