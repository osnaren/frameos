/// <reference types="vite/client" />

import type { ThreeElements } from '@react-three/fiber'

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly DEV?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly SANITY_PROJECT_ID?: string
      readonly SANITY_DATASET?: string
      readonly SANITY_API_TOKEN?: string
      readonly SANITY_API_VERSION?: string
      readonly SANITY_STUDIO_PROJECT_TITLE?: string
      readonly SANITY_WEBHOOK_SECRET?: string
      readonly UPSTASH_REDIS_REST_URL?: string
      readonly UPSTASH_REDIS_REST_TOKEN?: string
      readonly VERCEL_API_TOKEN?: string
      readonly VERCEL_PROJECT_ID?: string
      readonly VERCEL_TEAM_ID?: string
      readonly RECONCILE_SECRET?: string
      readonly CRON_SECRET?: string
      readonly SENTRY_DSN?: string
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {}
