import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';
import { useLocation, useOutlet } from 'react-router-dom';

import Loader from '../logo/Loader';
import Footer from './Footer/Footer';
import Header from './Header';

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { ref: footerRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  return (
    <div className="bg-surface flex min-h-screen flex-col text-[var(--color-text)]">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="flex-grow bg-[var(--color-background)] pt-16"
        >
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <Loader />
              </div>
            }
          >
            {outlet}
          </Suspense>
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
