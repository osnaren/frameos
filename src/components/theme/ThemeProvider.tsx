/* eslint-disable react-refresh/only-export-components */
import type { Theme } from '@ctypes/theme';
import { useTheme } from '@hooks/useTheme';
import { applyTheme, cssVariables } from '@styles/colors';
import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setDynamicTheme: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component that provides theme context to its children.
 *
 * @param {Object} props - The props object.
 * @param {React.ReactNode} props.children - The children components.
 * @returns {JSX.Element} The ThemeProvider component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const themeContext = useTheme();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssVariables;
    document.head.appendChild(style);
    applyTheme(themeContext.theme);

    return () => {
      document.head.removeChild(style);
    };
  }, [themeContext.theme]);

  return (
    <ThemeContext.Provider value={themeContext}>
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use the ThemeContext.
 *
 * @returns {ThemeContextType} The theme context value.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
