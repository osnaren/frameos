import './styles.scss';

import { useFeaturedPhotos } from '@hooks/usePhotos';
import { AnimatePresence, motion } from 'framer-motion';

import { PhotoCard } from './PhotoCard';
import { useSlider } from './useSlider';

export default function FeaturedSlider() {
  const { photos, isLoading } = useFeaturedPhotos();
  const { currentIndex, next, prev, pause, resume } = useSlider(photos.length);

  if (isLoading || photos.length === 0) return null;

  return (
    <section
      className="py-24 bg-[var(--color-background)]"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl font-bold mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {Array.from("Shots I'd Swipe Right On").map((letter, index) => (
            <motion.span key={index} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </motion.h2>

        <div className="relative h-[600px] w-full max-w-2xl mx-auto">
          <AnimatePresence>
            {[...Array(5)].map((_, i) => {
              const photoIndex = (currentIndex + i) % photos.length;
              return (
                <motion.div
                  key={`${photoIndex}-${i}`}
                  className="absolute inset-0"
                  initial={{ scale: 0.9, y: 20 * i, opacity: 1 - i * 0.2 }}
                  animate={{ scale: 1 - i * 0.05, y: 20 * i, opacity: 1 - i * 0.2 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ zIndex: 5 - i }}
                >
                  <PhotoCard photo={photos[photoIndex]} />
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="absolute bottom-[-60px] left-1/2 transform -translate-x-1/2 flex gap-2">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  idx === currentIndex ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <motion.button
            onClick={prev}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-[var(--color-shadow)]"
            initial={{ scale: 1, x: 0 }}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            aria-label="Previous"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </motion.svg>
          </motion.button>
          <motion.button
            onClick={next}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-[var(--color-shadow)]"
            initial={{ scale: 1, x: 0 }}
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            aria-label="Next"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
