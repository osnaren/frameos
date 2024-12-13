export type ThemeMode = 'light' | 'dark' | 'dynamic';

export interface ThemeColors {
  background: string; // Background color for the app
  text: string; // Primary text color
  mutedText: string; // Secondary or muted text color
  primary: string; // Primary brand color
  secondary: string; // Secondary brand color
  accent: string; // Accent color for highlights
  surface: string; // Background for cards or containers
  border: string; // Border color for UI elements
}

export interface Theme {
  mode: ThemeMode; // Current theme mode (light, dark, dynamic)
  colors: ThemeColors;
}
