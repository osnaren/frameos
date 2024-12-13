import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeContext } from './ThemeProvider';
import ThemeTransition from './ThemeTransition';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();
  const [isAnimating, setIsAnimating] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    if (isAnimating) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    toggleTheme();
    setTimeout(() => {
      setIsAnimating(false);
    }, 100);
  };

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className={`p-2 rounded-full transition-colors ${
          isAnimating ? 'cursor-not-allowed opacity-50' : 'hover:bg-[var(--color-accent)]'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={isAnimating}
        aria-label={`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme.mode === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
      </motion.button>
      <ThemeTransition isAnimating={isAnimating} onAnimationComplete={handleAnimationComplete} origin={origin} />
    </>
  );
}
