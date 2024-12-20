export const FONTS = {
  display: {
    family: 'Playfair Display',
    weights: [400, 700],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  },
  body: {
    family: 'Lato',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap',
  },
  accent: {
    family: 'Ubuntu',
    weights: [500, 700],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@500;700&display=swap',
  },
  decorative: {
    family: 'Tanzania Guides',
    weights: [400],
    googleUrl: 'https://fonts.googleapis.com/css2?family=Tanzania+Guides&display=swap',
  },
} as const;

export const TYPE_SCALE = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
} as const;
