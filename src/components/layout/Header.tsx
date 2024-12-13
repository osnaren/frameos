import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { MenuButton, FullScreenMenu } from './Menu';

export default function Header() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <nav className="relative px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="text-2xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
            >
              PhotoFolio
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <ThemeToggle />
              <MenuButton />
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-4">
              <ThemeToggle />
              <MenuButton />
            </div>
          </div>
        </nav>
      </div>
      <FullScreenMenu />
    </header>
  );
}
