import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import OptimizedImage from '@components/OptimizedImage';
import type { AboutImage } from '@ctypes/about';
import './styles.css';

interface ImageGridProps {
  images: AboutImage[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    if (!gridRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseX.set(x / rect.width - 0.5);
      mouseY.set(y / rect.height - 0.5);
    };

    gridRef.current.addEventListener('mousemove', handleMouseMove);
    return () => {
      gridRef.current?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={inViewRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: inView ? 1 : 0 }}
      className="grid"
      style={{ '--perspective': '1000px' } as React.CSSProperties}
    >
      <motion.div
        ref={gridRef}
        className="grid-wrap"
        style={{
          rotateX: mouseY.get() * 20,
          rotateY: mouseX.get() * -20,
        }}
      >
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            className="grid__item"
            initial={{ opacity: 0, z: -100 }}
            animate={{
              opacity: 1,
              z: 0,
              transition: { delay: index * 0.1 },
            }}
            whileHover={{
              z: 50,
              transition: { duration: 0.3 },
            }}
          >
            <motion.div
              className="grid__item-inner"
              style={{
                backgroundImage: `url(${image.imageUrl})`,
              }}
              whileHover={{
                scale: 1.2,
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
