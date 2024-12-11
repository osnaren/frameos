import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Photo } from '../../types/photo';
import OptimizedImage from '../OptimizedImage';
import { useFeaturedPhotos } from '../../hooks/usePhotos';

export default function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { photos, isLoading } = useFeaturedPhotos();

  useEffect(() => {
    if (photos.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [photos.length]);

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? photos.length - 1 : prev - 1;
      }
      return (prev + 1) % photos.length;
    });
  };

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <OptimizedImage
            publicId={photos[currentIndex].imageUrl}
            alt={photos[currentIndex].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2"
            >
              {photos[currentIndex].title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg"
            >
              {photos[currentIndex].description}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => navigate('prev')}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Previous photo"
      >
        <ChevronLeftIcon className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={() => navigate('next')}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Next photo"
      >
        <ChevronRightIcon className="w-6 h-6 text-white" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to photo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}