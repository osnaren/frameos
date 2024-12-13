import React from 'react';
import { motion } from 'framer-motion';

interface HeroBackgroundProps {
  style?: React.CSSProperties;
}

export function HeroBackground({ style }: HeroBackgroundProps) {
  return (
    <motion.div
      className="absolute inset-0 -z-10"
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />
      <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
      {/* Uncomment for video background
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>
      */}
    </motion.div>
  );
}
