export type ThemeMode = 'light' | 'dark' | 'dynamic';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}