import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '../types/photo';
import OptimizedImage from './OptimizedImage';

interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
  if (!photo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-[var(--color-background)] shadow-xl rounded-2xl">
              <div className="relative aspect-w-16 aspect-h-9">
                <OptimizedImage publicId={photo.imageUrl} alt={photo.title} className="object-contain w-full h-full" />
              </div>
              <div className="mt-4">
                <Dialog.Title as="h3" className="text-lg font-medium text-[var(--color-text)]">
                  {photo.title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-[var(--color-text)] opacity-80">{photo.description}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-[var(--color-text)]">Photo Details</h4>
                    <ul className="mt-2 space-y-1 text-[var(--color-text)] opacity-80">
                      <li>ISO: {photo.metadata.iso}</li>
                      <li>Shutter Speed: {photo.metadata.shutterSpeed}</li>
                      <li>Aperture: {photo.metadata.aperture}</li>
                      <li>Camera: {photo.metadata.camera}</li>
                      <li>Lens: {photo.metadata.lens}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-[var(--color-text)]">Location</h4>
                    <p className="mt-2 text-[var(--color-text)] opacity-80">{photo.metadata.location}</p>
                    <div className="mt-4">
                      <h4 className="font-medium text-[var(--color-text)]">Tags</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {photo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs rounded-full bg-[var(--color-accent)] text-[var(--color-text)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
