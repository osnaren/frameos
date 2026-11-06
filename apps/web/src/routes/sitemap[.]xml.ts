import { createFileRoute } from '@tanstack/react-router'

import { getCacheHeaders, joinCacheTags } from '@/server/cache/policy'
import { getSiteOrigin } from '@/server/http/site-origin'
import { ServiceUnavailableError, createPortfolioRepository } from '@/server/repository/portfolio'
import { collectSitemapEntries, renderSitemapXml } from '@/server/sitemap'

const repository = createPortfolioRepository()

/**
 * Cached at the CDN like a page, and tagged so the Sanity webhook's
 * photo/world invalidations (`gallery`, `worlds`) purge it too.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { worlds, photos } = await repository.getSitemapContent()
          const xml = renderSitemapXml(
            collectSitemapEntries({ origin: getSiteOrigin(request), worlds, photos })
          )

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              ...getCacheHeaders('page'),
              'Vercel-Cache-Tag': joinCacheTags(['sitemap', 'gallery', 'worlds']),
            },
          })
        } catch (error) {
          if (error instanceof ServiceUnavailableError) {
            return new Response('Sitemap temporarily unavailable.', {
              status: 503,
              headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
            })
          }
          throw error
        }
      },
    },
  },
})
