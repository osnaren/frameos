import './styles.scss';

import OptimizedImage from '@components/OptimizedImage';
import type { AboutImage } from '@ctypes/about';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface ImageGridProps {
  images: AboutImage[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Smooth spring-based scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 15,
    stiffness: 30,
  });

  // Transform values
  const translateX = useTransform(smoothProgress, [0, 0.5, 1], ['0%', '-50%', '-100%']);

  const rotateY = useTransform(smoothProgress, [0, 0.5, 1], [20, 0, -20]);

  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  // Mouse parallax effect
  useEffect(() => {
    if (!gridRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;

      const { clientX, clientY } = e;
      const { width, height, left, top } = gridRef.current.getBoundingClientRect();

      const x = (clientX - left) / width - 0.5;
      const y = (clientY - top) / height - 0.5;

      gridRef.current.style.transform = `
        rotateY(${x * 5}deg)
        rotateX(${-y * 5}deg)
        translateZ(0)
      `;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="image-grid-container">
      <motion.div
        className="image-grid-wrapper"
        style={{
          scale,
        }}
      >
        <motion.div
          ref={gridRef}
          className="image-grid"
          style={{
            x: translateX,
            rotateY,
          }}
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              className="image-item"
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: inView ? 1 : 0,
                y: inView ? 0 : 50,
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
              ref={index === 0 ? inViewRef : undefined}
            >
              <OptimizedImage
                publicId={image.publicId}
                alt={image.description}
                className="image"
                priority={index < 4}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
