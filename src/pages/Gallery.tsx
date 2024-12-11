import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCard from '../components/PhotoCard';
import PhotoModal from '../components/PhotoModal';
import { useAllPhotos } from '../hooks/usePhotos';
import type { Photo, PhotoCategory } from '../types/photo';
import { useThemeContext } from '../components/layout/ThemeProvider';

const categories: PhotoCategory[] = ['portraits', 'landscapes', 'candid', 'street', 'nature', 'architecture'];

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const { photos, isLoading, error } = useAllPhotos();
  const { theme } = useThemeContext();

  const filteredPhotos = photos
    .filter((photo) => selectedCategory === 'all' || photo.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load photos. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gallery | PhotoFolio</title>
        <meta name="description" content="Browse through my photography collection" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', ...categories].map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category as PhotoCategory | 'all')}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-accent)] text-[var(--color-text)] hover:bg-opacity-80'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </motion.button>
              ))}
            </div>
            <label htmlFor="sort-by" className="sr-only">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
              className="px-4 py-2 rounded-lg border border-[var(--color-accent)] bg-[var(--color-background)] text-[var(--color-text)]"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center min-h-[400px]"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <PhotoModal photo={selectedPhoto} isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      </div>
    </>
  );
}
