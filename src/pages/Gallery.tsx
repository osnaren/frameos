import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import PhotoCard from '../components/PhotoCard';
import PhotoModal from '../components/PhotoModal';
import { useThemeContext } from '../components/theme/ThemeProvider';
import { useAllPhotos } from '../hooks/usePhotos';
import type { Photo, PhotoCategory } from '../types/photo';

const categories: PhotoCategory[] = ['portraits', 'landscapes', 'candid', 'street', 'nature', 'architecture'];

export default function Gallery() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const { photos, isLoading, error } = useAllPhotos();
  useThemeContext();

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load photos. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <title>Gallery | PhotoFolio</title>
      <meta name="description" content="Browse through my photography collection" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', ...categories].map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category as PhotoCategory | 'all')}
                  className={`rounded-full px-4 py-2 text-sm whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'hover:bg-opacity-80 bg-[var(--color-accent)] text-[var(--color-text)]'
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
              className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-background)] px-4 py-2 text-[var(--color-text)]"
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
              className="flex min-h-[400px] items-center justify-center"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <PhotoModal photo={selectedPhoto} isOpen={Boolean(selectedPhoto)} onClose={() => setSelectedPhoto(null)} />
      </div>
    </>
  );
}
