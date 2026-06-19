import { setResponseHeader } from '@tanstack/react-start/server'
import { invalidateByTag } from '@vercel/functions'

import { getCacheHeaders, joinCacheTags } from '@/server/cache/policy'
import type { CacheProfile } from '@/server/cache/policy'
import { getServerEnv } from '@/server/env'
import { captureException } from '@/server/observability/error-tracker'
import { logInfo, logWarn } from '@/server/observability/logger'

export function applyCacheResponse(profile: CacheProfile, tags: string[]) {
  const headers = getCacheHeaders(profile)

  Object.entries(headers).forEach(([name, value]) => {
    setResponseHeader(name, value)
  })

  if (tags.length > 0) {
    setResponseHeader('Vercel-Cache-Tag', joinCacheTags(tags))
  }
}

export async function invalidateCacheTags(tags: string[]) {
  const sanitizedTags = tags.filter(Boolean)

  if (sanitizedTags.length === 0) {
    return []
  }

  try {
    await Promise.all(sanitizedTags.map((tag) => invalidateByTag(tag)))
    logInfo('cache.invalidate', { cacheTags: sanitizedTags, outcome: 'success' })
    return sanitizedTags
  } catch (error) {
    captureException(error, {
      cacheTags: sanitizedTags,
      outcome: 'vercel-runtime-invalidate-failed',
    })

    const env = getServerEnv()
    if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) {
      logWarn('cache.invalidate.degraded', {
        cacheTags: sanitizedTags,
        message: 'Runtime invalidation failed and REST fallback is not configured.',
      })
      return sanitizedTags
    }

    const url = new URL(
      `/v1/projects/${env.VERCEL_PROJECT_ID}/cache/invalidate-by-tag`,
      'https://api.vercel.com'
    )

    if (env.VERCEL_TEAM_ID) {
      url.searchParams.set('teamId', env.VERCEL_TEAM_ID)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: sanitizedTags.slice(0, 16),
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      logWarn('cache.invalidate.rest-failed', {
        cacheTags: sanitizedTags,
        outcome: response.status.toString(),
        message: text,
      })
    }

    return sanitizedTags
  }
}
