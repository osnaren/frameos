import { useState, useEffect } from 'react';
import type { ThemeMode, Theme } from '../types/theme';

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#FFFFFF',
    text: '#333333',
    primary: '#FF6F61',
    secondary: '#6B5B95',
    accent: '#E0E0E0',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#121212',
    text: '#E0E0E0',
    primary: '#FF6F61',
    secondary: '#6B5B95',
    accent: '#2D2D2D',
  },
};

export function useTheme() {
  const [storedTheme, setStoredTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'light';
  });
  const [theme, setTheme] = useState<Theme>(storedTheme === 'dark' ? darkTheme : lightTheme);
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('theme', storedTheme);

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

// Helper function to determine contrasting text color
function getContrastColor(hexcolor: string): string {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#333333' : '#E0E0E0';
}
