import { FONT_FAMILIES, FONT_WEIGHTS, TYPE_SCALE } from './constants';
import type { FontConfig } from './types';

export function createFontStyle(config: FontConfig): string {
  return `
    font-family: ${config.family};
    font-weight: ${config.weight};
    font-size: ${config.size};
  `;
}

// Predefined font styles for common use cases
export const fontStyles = {
  // Headlines
  h1: {
    family: FONT_FAMILIES.display,
    weight: FONT_WEIGHTS.bold,
    size: TYPE_SCALE['6xl'],
  },
  h2: {
    family: FONT_FAMILIES.display,
    weight: FONT_WEIGHTS.bold,
    size: TYPE_SCALE['5xl'],
  },
  h3: {
    family: FONT_FAMILIES.display,
    weight: FONT_WEIGHTS.bold,
    size: TYPE_SCALE['4xl'],
  },

  // Body text
  bodyLarge: {
    family: FONT_FAMILIES.body,
    weight: FONT_WEIGHTS.regular,
    size: TYPE_SCALE.lg,
  },
  bodyDefault: {
    family: FONT_FAMILIES.body,
    weight: FONT_WEIGHTS.regular,
    size: TYPE_SCALE.base,
  },
  bodySmall: {
    family: FONT_FAMILIES.body,
    weight: FONT_WEIGHTS.regular,
    size: TYPE_SCALE.sm,
  },

  // Navigation and CTAs
  nav: {
    family: FONT_FAMILIES.accent,
    weight: FONT_WEIGHTS.medium,
    size: TYPE_SCALE.base,
  },
  button: {
    family: FONT_FAMILIES.accent,
    weight: FONT_WEIGHTS.medium,
    size: TYPE_SCALE.base,
  },

  // Decorative elements
  special: {
    family: FONT_FAMILIES.decorative,
    weight: FONT_WEIGHTS.regular,
    size: TYPE_SCALE['2xl'],
  },
} as const;
