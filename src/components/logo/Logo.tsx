import './Logo.style.scss';

import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import FrameOS from './FrameOS';

function Logo() {
  const frameRef = useRef<SVGPathElement>(null);
  const textGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (frameRef.current) {
      gsap.set(frameRef.current, {
        strokeDasharray: frameRef.current.getTotalLength(),
        strokeDashoffset: frameRef.current.getTotalLength(),
      });
    }
  }, []);

  const handleHover = (hovering: boolean) => {
    const tl = gsap.timeline();
    const length = frameRef.current?.getTotalLength() || 0;

    if (hovering) {
      // Frame drawing animation
      tl.fromTo(
        frameRef.current,
        {
          strokeDashoffset: length,
          opacity: 1,
        },
        {
          strokeDashoffset: 0,
          duration: 0.4,
          ease: 'power2.inOut',
          // delay: 0.3,
        }
      )
        // Text movement animation
        .to(
          textGroupRef.current,
          {
            x: 10,
            translateY: 0,
            duration: 0.3,
            ease: 'power2.inOut',
            opacity: 1,
            delay: -0.2,
          },
          0
        );
    } else {
      tl.to(frameRef.current, {
        strokeDashoffset: length,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.inOut',
      }).to(
        textGroupRef.current,
        {
          x: 0,
          translateY: -40,
          duration: 0.4,
          ease: 'power2.inOut',
          delay: 0.4,
        },
        0
      );
    }
  };

  return (
    <motion.div
      className="logo-container"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      onHoverStart={() => handleHover(true)}
      onHoverEnd={() => handleHover(false)}
    >
      <FrameOS
        width={80}
        height={80}
        frameRef={frameRef}
        textGroupRef={textGroupRef}
        className="text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors duration-300"
      />
    </motion.div>
  );
}

export default Logo;
