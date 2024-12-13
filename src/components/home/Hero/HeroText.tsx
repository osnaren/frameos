import React from 'react';
import { motion } from 'framer-motion';

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  }),
};

export function HeroText() {
  return (
    <div className="space-y-4">
      <motion.h1
        custom={0}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white"
      >
        Capturing the World
      </motion.h1>
      <motion.h2
        custom={1}
        initial="hidden"
        animate="visible"
        variants={textVariants}
        className="text-3xl md:text-5xl lg:text-6xl font-bold text-white"
      >
        Through My Lens
      </motion.h2>
    </div>
  );
}
