import type { AboutImage } from '@ctypes/about';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

import OptimizedImage from '../OptimizedImage';

interface ImageGridProps {
  images: AboutImage[];
}

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ImageGrid({ images }: ImageGridProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-2 md:grid-cols-3 gap-4 my-12"
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {images.map((image) => (
        <motion.div
          key={image.id}
          className="relative aspect-square overflow-hidden rounded-lg"
          variants={itemVariants}
          whileHover={{
            scale: 1.02,
            rotateY: 5,
            rotateX: -5,
            transition: { duration: 0.4 },
          }}
          style={{ perspective: '1000px' }}
        >
          <OptimizedImage publicId={image.publicId} alt={image.description} className="w-full h-full object-cover" />
        </motion.div>
      ))}
    </motion.div>
  );
}
