export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss', 'prettier-plugin-tailwindcss-canonical-classes'],
  // Sort against the web app's own Tailwind v4 theme, not the default one.
  tailwindStylesheet: './apps/web/src/styles.css',
  // Keep spacing inside class strings; collapsing it turns `' is-active'` in
  // a template literal into a class glued to the one before it.
  tailwindPreserveWhitespace: true,
}
