import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

import { useThemeContext } from './ThemeProvider';
import ThemeTransition from './ThemeTransition';

export default function ThemeToggle() {
  const { theme } = useThemeContext();
  const [isAnimating, setIsAnimating] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (!buttonRef.current || isAnimating) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsAnimating(true);
  }, [isAnimating]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setOrigin(null);
  }, []);

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded-full ${
          isAnimating ? 'cursor-not-allowed opacity-50' : 'hover:bg-[var(--color-accent)]'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={isAnimating}
        aria-label={`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} theme`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme.mode}
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-6 h-6"
          >
            {theme.mode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
      <ThemeTransition isAnimating={isAnimating} onAnimationComplete={handleAnimationComplete} origin={origin} />
    </>
  );
}
