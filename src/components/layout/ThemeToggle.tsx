import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeContext } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-[var(--color-accent)] transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme.mode === 'dark' ? (
        <SunIcon className="w-6 h-6" />
      ) : (
        <MoonIcon className="w-6 h-6" />
      )}
    </motion.button>
  );
}