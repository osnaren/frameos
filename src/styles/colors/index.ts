import type { Theme } from '@/types/theme';
export * from './constants';
export * from './themes';

// CSS Custom Properties
export const cssVariables = `
  :root {
    /* Base */
    --color-background: var(--theme-background);
    --color-text: var(--theme-text);
    --color-muted-text: var(--theme-mutedText);

    /* Brand */
    --color-primary: var(--theme-primary);
    --color-secondary: var(--theme-secondary);
    --color-accent: var(--theme-accent);

    /* Surface */
    --color-surface: var(--theme-surface);
    --color-border: var(--theme-border);

    /* State Colors */
    --color-hover: var(--theme-accent-hover, var(--theme-primary)); /* Fallback */
    --color-active: var(--theme-accent-active, var(--theme-primary-dark)); /* Fallback */

    /* Buttons */
    --color-button-background: var(--color-primary);
    --color-button-text: var(--color-text);
    --color-button-hover: var(--color-hover);
    --color-button-active: var(--color-active);

    --color-shadow: var(--theme-shadow);
  }
`;

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--theme-${key}`, value);
    } else {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        root.style.setProperty(`--theme-${key}-${nestedKey}`, nestedValue as string);
      });
    }
  });
};
