import { darkTheme, lightTheme } from '@styles/colors/themes';
import { getContrastColor } from '@utils/color';
import { useEffect, useState } from 'react';

import type { Theme, ThemeMode } from '@/types/theme';

export function useTheme() {
  const [storedTheme, setStoredTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return (saved as ThemeMode) || (prefersDark ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  });
  const [theme, setTheme] = useState<Theme>(storedTheme === 'dark' ? darkTheme : lightTheme);
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('theme', storedTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }

    if (storedTheme === 'dynamic' && dominantColor) {
      setTheme({
        mode: 'dynamic',
        colors: {
          ...lightTheme.colors,
          background: dominantColor,
          text: getContrastColor(dominantColor),
        },
      });
    } else {
      setTheme(storedTheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [storedTheme, dominantColor]);

  const toggleTheme = () => {
    const newTheme = storedTheme === 'light' ? 'dark' : 'light';
    setStoredTheme(newTheme);
  };

  const setDynamicTheme = (color: string) => {
    setDominantColor(color);
    setStoredTheme('dynamic');
  };

  return { theme, toggleTheme, setDynamicTheme };
}
