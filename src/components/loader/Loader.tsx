import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import './Loader.style.scss';

const Loader: React.FC = () => {
  const cameraRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    if (cameraRef.current) {
      gsap.to(cameraRef.current, {
        rotation: 10,
        duration: 0.2,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      });
    }

    lettersRef.current.forEach((letter, index) => {
      const directions = [
        { x: -20, y: 20 },
        { x: 20, y: -20 },
        { x: -20, y: -20 },
        { x: 20, y: 20 },
        { x: 0, y: 0 },
      ];

      gsap.fromTo(
        letter,
        { opacity: 0, ...directions[index] },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.5,
          delay: 1 + index * 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut',
        }
      );
    });
  }, []);

  const letters = 'SMILE'.split('');

  return (
    <motion.div
      className="loader-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div ref={cameraRef} className="camera-icon">
        <img src="/camera.gif" alt="Flashing Camera" />
      </div>
      {/* <div className="loader-text">
        {letters.map((letter, index) => (
          <motion.span key={index} ref={(el) => (lettersRef.current[index] = el!)} className="loader-letter">
            {letter}
          </motion.span>
        ))}
      </div> */}
    </motion.div>
  );
};

export default Loader;
