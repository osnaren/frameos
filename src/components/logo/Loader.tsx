import './Loader.style.scss';

import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import FrameOS from './FrameOS';

function Loader() {
  const frameRef = useRef<SVGPathElement>(null);
  const textGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (frameRef.current && textGroupRef.current) {
      const length = frameRef.current.getTotalLength();

      gsap.set(frameRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      gsap.set(textGroupRef.current, {
        translateX: -150,
      });

      const tl = gsap.timeline({
        repeat: -1,
        smoothChildTiming: true,
        defaults: { ease: 'sine.inOut' },
      });

      tl.to(frameRef.current, {
        strokeDashoffset: 0,
        duration: 1,
      })
        .to(
          textGroupRef.current,
          {
            translateX: 0,
            duration: 0.8,
            ease: 'power1.out',
          },
          '-=0.8'
        )
        .to({}, { duration: 0.3 }) // Pause
        .to(frameRef.current, {
          strokeDashoffset: -length,
          duration: 0.8,
        })
        .to(textGroupRef.current, {
          translateX: -150, // Reset position for next cycle
          duration: 0.8,
          ease: 'power1.inOut',
        });
    }
  }, []);

  const loaderSize = Math.min(window.innerWidth * 0.1, 100); // Responsive size

  return (
    <motion.div
      className="flex items-center justify-center relative loader-container"
      role="alert"
      aria-label="Loading animation"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <FrameOS
        width={loaderSize}
        height={loaderSize}
        frameRef={frameRef}
        textGroupRef={textGroupRef}
        className="text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors duration-300 loader-logo"
      />
    </motion.div>
  );
}

export default Loader;
