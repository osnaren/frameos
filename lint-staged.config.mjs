export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': (files) =>
    `pnpm --filter ./apps/web exec eslint --fix ${files.join(' ')}`,
  'apps/studio/**/*.{js,jsx,ts,tsx}': (files) =>
    `pnpm --filter ./apps/studio exec eslint --fix ${files.join(' ')}`,
  '**/*.{js,jsx,ts,tsx,css,md,json,yaml,yml}': 'prettier --write --ignore-unknown',
}
