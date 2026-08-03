import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: [
      'src/**/tests/**/*.test.ts',
      'src/**/tests/**/*.test.tsx',
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
    ],
    exclude: ['legacy-src/**'],
  },
})
