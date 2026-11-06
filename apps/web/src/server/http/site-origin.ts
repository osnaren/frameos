import { getSiteOriginConfig } from '@/server/env'
import { resolveSiteOrigin } from '@/server/site-url'

/** The origin the visitor actually requested, honouring the proxy's forwarded headers. */
export function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

/** The canonical site origin for absolute URLs (see server/site-url.ts for precedence). */
export function getSiteOrigin(request: Request) {
  return resolveSiteOrigin({
    ...getSiteOriginConfig(),
    requestOrigin: getRequestOrigin(request),
  })
}
