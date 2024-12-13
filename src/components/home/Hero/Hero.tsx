import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useParallax } from '@hooks/useParallax';
import { HeroBackground } from './HeroBackground';
import { HeroText } from './HeroText';

export default function Hero() {
  const { ref, parallaxStyle } = useParallax();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground style={parallaxStyle} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <HeroText />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/gallery"
            className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Explore My Work
          </Link>
          <Link
            to="/contact"
            className="px-8 py-3 border-2 border-[var(--color-text)] text-[var(--color-text)] rounded-lg font-medium hover:bg-[var(--color-text)] hover:text-[var(--color-background)] transition-colors"
          >
            Get in Touch
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
