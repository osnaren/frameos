export type CacheProfile = 'page' | 'gallery'

export function getCacheHeaders(profile: CacheProfile) {
  if (profile === 'gallery') {
    return {
      'Cache-Control': 'max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'Vercel-CDN-Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    }
  }

  return {
    'Cache-Control': 'max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    'Vercel-CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  }
}

export function joinCacheTags(tags: string[]) {
  return tags.filter(Boolean).join(',')
}
