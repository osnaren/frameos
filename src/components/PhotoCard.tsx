import React from 'react';
import { motion } from 'framer-motion';
import type { Photo } from '../types/photo';
import { usePreventImageDownload } from '../hooks/usePreventImageDownload';
import OptimizedImage from './OptimizedImage';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  usePreventImageDownload();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-w-3 aspect-h-2 overflow-hidden rounded-lg bg-gray-100">
        <OptimizedImage
          publicId={photo.publicId}
          alt={photo.title}
          className="object-cover select-none"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200" />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-gray-900">{photo.title}</h3>
        <p className="text-sm text-gray-500">{photo.category}</p>
      </div>
    </motion.div>
  );
}