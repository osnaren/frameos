import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

/** Sent with every response, pages and files alike. */
const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
}

/**
 * Static files. Build output under /assets is content-hashed, so it is cached
 * forever. Photos and icons keep stable names, so they get a long life with
 * background revalidation instead of `immutable`, and a re-exported photo
 * reaches visitors within a day.
 */
const immutable = 'public, max-age=31536000, immutable'
const longLived = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000'

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: { external: [/^@sentry\//] },
      routeRules: {
        '/**': { headers: securityHeaders },
        '/assets/**': { headers: { ...securityHeaders, 'cache-control': immutable } },
        '/photos/**': { headers: { ...securityHeaders, 'cache-control': longLived } },
        '/favicon/**': { headers: { ...securityHeaders, 'cache-control': longLived } },
        '/og-default.jpg': { headers: { ...securityHeaders, 'cache-control': longLived } },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})
