import { createFileRoute } from '@tanstack/react-router'

import { getCacheHeaders } from '@/server/cache/policy'
import { getSiteOrigin } from '@/server/http/site-origin'
import { renderRobotsTxt } from '@/server/sitemap'

/** Dynamic only because the Sitemap line must be an absolute URL on the canonical origin. */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(renderRobotsTxt(getSiteOrigin(request)), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...getCacheHeaders('page'),
          },
        }),
    },
  },
})
