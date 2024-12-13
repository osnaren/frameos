export const CRITICAL_FONTS = [
  // Display font
  {
    family: 'Playfair Display',
    weights: [400, 700],
    display: 'swap',
  },
  // Body font
  {
    family: 'Lato',
    weights: [400, 700],
    display: 'swap',
  },
  // Accent font
  {
    family: 'Ubuntu',
    weights: [500],
    display: 'swap',
  },
] as const;

export function generatePreloadLinks(): string {
  return CRITICAL_FONTS.map((font) =>
    font.weights
      .map(
        (weight) => `
      <link
        rel="preload"
        href="/fonts/${font.family.toLowerCase().replace(/\s+/g, '-')}/${weight}.woff2"
        as="font"
        type="font/woff2"
        crossorigin="anonymous"
      />
    `
      )
      .join('')
  ).join('');
}
