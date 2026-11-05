import { z } from 'zod'

/**
 * `.env.example` documents every optional key as blank (`KEY=`) so it's
 * discoverable. That means `process.env.KEY` is `""`, not `undefined`, for
 * anyone who copies it as-is. Treat blank as unset so `.optional()` fields
 * don't fail their `.min(1)`/`.url()` checks on an intentionally-empty value.
 */
const blankToUndefined = (value: unknown) => (value === '' ? undefined : value)

function optionalString() {
  return z.preprocess(blankToUndefined, z.string().min(1).optional())
}

function optionalUrl() {
  return z.preprocess(blankToUndefined, z.string().url().optional())
}

const serverEnvSchema = z.object({
  SANITY_PROJECT_ID: optionalString(),
  SANITY_DATASET: optionalString(),
  SANITY_API_TOKEN: optionalString(),
  SANITY_API_VERSION: z.string().min(1).default('2025-02-19'),
  SANITY_STUDIO_PROJECT_TITLE: z.string().min(1).default('FrameOS Studio'),
  SANITY_WEBHOOK_SECRET: optionalString(),
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: optionalString(),
  VERCEL_API_TOKEN: optionalString(),
  VERCEL_PROJECT_ID: optionalString(),
  VERCEL_TEAM_ID: optionalString(),
  RECONCILE_SECRET: optionalString(),
  CRON_SECRET: optionalString(),
  SENTRY_DSN: optionalString(),
  /** Validated leniently in server/site-url.ts — a typo must not take down every route. */
  VITE_SITE_URL: optionalString(),
  /** Vercel system variables (set automatically on Vercel; absent elsewhere). */
  VERCEL_ENV: optionalString(),
  VERCEL_PROJECT_PRODUCTION_URL: optionalString(),
})

type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedEnv: ServerEnv | null = null

export function getServerEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  cachedEnv = serverEnvSchema.parse(process.env)
  return cachedEnv
}

/**
 * The canonical-origin inputs for server/site-url.ts. `VITE_SITE_URL` is read
 * at runtime first (Vercel exposes project env vars to functions) and falls
 * back to the value Vite inlined at build time from a local `.env`.
 */
export function getSiteOriginConfig() {
  const env = getServerEnv()

  return {
    configuredUrl: env.VITE_SITE_URL ?? import.meta.env.VITE_SITE_URL,
    vercelEnv: env.VERCEL_ENV,
    vercelProductionHost: env.VERCEL_PROJECT_PRODUCTION_URL,
  }
}

export function hasSanityConfig() {
  const env = getServerEnv()
  return Boolean(env.SANITY_PROJECT_ID && env.SANITY_DATASET)
}

export function hasRedisConfig() {
  const env = getServerEnv()
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}
