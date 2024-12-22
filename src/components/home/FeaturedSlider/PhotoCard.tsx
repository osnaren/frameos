import OptimizedImage from '@components/OptimizedImage';
import type { Photo } from '@ctypes/photo';
import { motion } from 'framer-motion';

interface PhotoCardProps {
  photo: Photo;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function PhotoCard({ photo, onDragStart, onDragEnd }: PhotoCardProps) {
  return (
    <motion.div
      className="h-full w-full rounded-xl overflow-hidden shadow-2xl"
      whileHover={{ scale: 1.02 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-full w-full">
        <OptimizedImage publicId={photo?.publicId} alt={photo.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">{photo.title}</h3>
          <p className="text-base opacity-90">{photo?.metadata?.location}</p>
        </div>
      </div>
    </motion.div>
  );
}
