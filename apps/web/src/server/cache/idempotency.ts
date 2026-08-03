import { createHash } from 'node:crypto'

import { Redis } from '@upstash/redis'

import { getServerEnv, hasRedisConfig } from '@/server/env'
import { captureException } from '@/server/observability/error-tracker'
import { logWarn } from '@/server/observability/logger'

const memoryStore = new Map<string, number>()
const latestEventStore = new Map<string, string>()

let redisClient: Redis | null = null

function getRedisClient() {
  if (!hasRedisConfig()) {
    return null
  }

  if (redisClient) {
    return redisClient
  }

  const env = getServerEnv()
  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  })

  return redisClient
}

export function createFingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export async function claimIdempotencyKey(key: string, ttlSeconds = 60 * 60 * 72) {
  const redis = getRedisClient()

  if (!redis) {
    const existing = memoryStore.get(key)
    const now = Date.now()
    if (existing && existing > now) {
      return false
    }

    memoryStore.set(key, now + ttlSeconds * 1000)
    return true
  }

  try {
    const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds })
    return result === 'OK'
  } catch (error) {
    captureException(error, {
      outcome: 'idempotency-fallback',
      message: 'Redis idempotency store unavailable; falling back to in-memory mode.',
    })
    logWarn('idempotency.degraded', { idempotencyKey: key })
    return true
  }
}

export async function shouldProcessNewerEvent(key: string, nextTimestamp: string) {
  const redis = getRedisClient()

  if (!redis) {
    const current = latestEventStore.get(key)
    if (current && current >= nextTimestamp) {
      return false
    }

    latestEventStore.set(key, nextTimestamp)
    return true
  }

  try {
    const current = await redis.get<string>(key)

    if (current && current >= nextTimestamp) {
      return false
    }

    await redis.set(key, nextTimestamp)
    return true
  } catch (error) {
    captureException(error, {
      outcome: 'event-order-fallback',
      message: 'Redis ordering store unavailable; proceeding without dedupe timestamp protection.',
    })
    logWarn('event-order.degraded', {
      idempotencyKey: key,
      message:
        'Redis ordering store unavailable; proceeding without timestamp ordering protection.',
    })
    return true
  }
}
