import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { ref: footerRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pt-16"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <motion.div
        ref={footerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <Footer />
      </motion.div>
    </div>
  );
}