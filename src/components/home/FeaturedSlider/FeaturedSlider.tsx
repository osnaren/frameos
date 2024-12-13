import React from 'react';
import { motion } from 'framer-motion';
import { useFeaturedPhotos } from '@hooks/usePhotos';
import { PhotoCard } from './PhotoCard';
import { useSlider } from './useSlider';

export default function FeaturedSlider() {
  const { photos, isLoading } = useFeaturedPhotos();
  const { currentIndex, next, prev } = useSlider(photos.length);

  if (isLoading || photos.length === 0) return null;

  return (
    <section className="py-24 bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-12"
        >
          Featured Work
        </motion.h2>

        <div className="relative featured-slider">
          <div className="overflow-hidden h-full">
            <motion.div
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {photos.map((photo) => (
                <div key={photo.id} className="featured-slider-item">
                  <PhotoCard photo={photo} />
                </div>
              ))}
            </motion.div>
          </div>

          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
