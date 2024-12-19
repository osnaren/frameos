import { motion } from 'framer-motion';

export default function HeroText() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-6xl font-bold text-white"
      >
        Welcome to FrameOS
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="text-xl text-gray-300 mt-4"
      >
        Discover the world through breathtaking photography.
      </motion.p>
    </div>
  );
}
