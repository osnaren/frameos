import React from 'react';
import { motion } from 'framer-motion';
import { SocialLinks } from './Footer/SocialLinks';
import { shutterAnimation } from './Footer/animations';
import { useThemeContext } from './ThemeProvider';

export default function Footer() {
  const { theme } = useThemeContext();
  const overlayClass = theme.mode === 'dark' ? 'bg-black/30' : 'bg-white/30';

  return (
    <footer className="relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src="/footer-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 ${overlayClass}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Tagline */}
          <motion.p
            variants={shutterAnimation}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="text-xl font-medium text-[var(--color-text)]"
          >
            Capturing moments, one frame at a time.
          </motion.p>

          {/* Social Links */}
          <SocialLinks />

          {/* Copyright and Credits */}
          <div className="flex flex-col items-center space-y-2 text-sm text-[var(--color-text)]/80">
            <p>&copy; 2024 OSLabs. All rights reserved.</p>
            <p>
              Code by{' '}
              <a
                href="https://github.com/osnaren/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline"
              >
                Naren
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
