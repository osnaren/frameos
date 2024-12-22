import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <motion.h1
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-6xl md:text-8xl font-bold text-[var(--color-text)]"
      >
        Say Hello!
      </motion.h1>
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-background)]" />
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
      </motion.div>
    </div>
  );
}
