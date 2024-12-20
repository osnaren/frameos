import { COLORS } from './constants';
import type { Theme } from '@/types/theme';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: COLORS.background.light,
    text: COLORS.text.light,
    primary: COLORS.primary.light,
    secondary: COLORS.secondary.light,
    accent: COLORS.accent.light,
    surface: COLORS.surface.light,
    border: COLORS.border.light,
    mutedText: COLORS.mutedText.light,
    shadow: COLORS.shadow.light,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: COLORS.background.dark,
    text: COLORS.text.dark,
    primary: COLORS.primary.dark,
    secondary: COLORS.secondary.dark,
    accent: COLORS.accent.dark,
    surface: COLORS.surface.dark,
    border: COLORS.border.dark,
    mutedText: COLORS.mutedText.dark,
    shadow: COLORS.shadow.dark,
  },
};
