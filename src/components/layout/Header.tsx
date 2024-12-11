import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="underline"
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-[var(--color-primary)]"
                      />
                    )}
                  </Link>
                );
              })}
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-0 bg-[var(--color-background)] md:hidden"
            >
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-2xl font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <ThemeToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}