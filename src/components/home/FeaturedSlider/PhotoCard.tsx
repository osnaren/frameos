import { motion } from 'framer-motion';
import type { Photo } from '@ctypes/photo';
import OptimizedImage from '@components/OptimizedImage';

interface PhotoCardProps {
  photo: Photo;
}

export function PhotoCard({ photo }: PhotoCardProps) {
  return (
    <motion.div className="h-full w-full" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
      <div className="relative h-full w-full rounded-lg overflow-hidden">
        <OptimizedImage publicId={photo.publicId} alt={photo.title} className="featured-slider-image" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-xl font-bold mb-2">{photo.title}</h3>
          <p className="text-sm opacity-80">{photo?.metadata?.location}</p>
        </div>
      </div>
    </motion.div>
  );
}
