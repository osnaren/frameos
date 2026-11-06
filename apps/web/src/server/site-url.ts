/**
 * Which origin canonical links, Open Graph URLs, the sitemap, and robots.txt
 * point at. Pure so it can be unit-tested; the request-bound wrapper lives in
 * server-functions/portfolio.ts.
 *
 * Precedence:
 * 1. `VITE_SITE_URL` when it is a valid absolute http(s) URL — the explicit
 *    canonical domain (set it in production once a custom domain exists).
 * 2. On a Vercel production deployment, `VERCEL_PROJECT_PRODUCTION_URL` — the
 *    project's production domain, so `*.vercel.app` aliases and www/apex
 *    variants all canonicalise to one host.
 * 3. The request's own origin (previews, local dev, self-hosting).
 */
export interface SiteOriginInputs {
  configuredUrl?: string
  vercelEnv?: string
  vercelProductionHost?: string
  requestOrigin: string
}

export function normalizeOrigin(value: string | undefined) {
  if (!value?.trim()) {
    return undefined
  }

  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : undefined
  } catch {
    return undefined
  }
}

export function resolveSiteOrigin(inputs: SiteOriginInputs) {
  const configured = normalizeOrigin(inputs.configuredUrl)
  if (configured) {
    return configured
  }

  if (inputs.vercelEnv === 'production' && inputs.vercelProductionHost?.trim()) {
    const production = normalizeOrigin(`https://${inputs.vercelProductionHost.trim()}`)
    if (production) {
      return production
    }
  }

  return normalizeOrigin(inputs.requestOrigin) ?? inputs.requestOrigin
}
