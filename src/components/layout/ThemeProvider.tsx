import React, { createContext, useContext } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../types/theme';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setDynamicTheme: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeContext = useTheme();

  return (
    <ThemeContext.Provider value={themeContext}>
      <div
        style={
          {
            '--color-background': themeContext.theme.colors.background,
            '--color-text': themeContext.theme.colors.text,
            '--color-primary': themeContext.theme.colors.primary,
            '--color-secondary': themeContext.theme.colors.secondary,
            '--color-accent': themeContext.theme.colors.accent,
          } as React.CSSProperties
        }
        className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300 ease-in-out"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
