import { z } from 'zod'

const serverEnvSchema = z.object({
  SANITY_PROJECT_ID: z.string().min(1).optional(),
  SANITY_DATASET: z.string().min(1).optional(),
  SANITY_API_TOKEN: z.string().min(1).optional(),
  SANITY_API_VERSION: z.string().min(1).default('2025-02-19'),
  SANITY_STUDIO_PROJECT_TITLE: z.string().min(1).default('FrameOS Studio'),
  SANITY_WEBHOOK_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  VERCEL_API_TOKEN: z.string().min(1).optional(),
  VERCEL_PROJECT_ID: z.string().min(1).optional(),
  VERCEL_TEAM_ID: z.string().min(1).optional(),
  RECONCILE_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1).optional(),
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

export function getPublicRuntimeConfig() {
  return {
    siteUrl: import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000',
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
