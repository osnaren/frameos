import { setResponseHeader } from '@tanstack/react-start/server'

import { getCacheHeaders, joinCacheTags, type CacheProfile } from '@/server/cache/policy'

export function applyCacheResponse(profile: CacheProfile, tags: string[]) {
  const headers = getCacheHeaders(profile)

  Object.entries(headers).forEach(([name, value]) => {
    setResponseHeader(name, value)
  })

  if (tags.length > 0) {
    setResponseHeader('Vercel-Cache-Tag', joinCacheTags(tags))
  }
}
