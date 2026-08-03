import { createFileRoute } from '@tanstack/react-router'

import { getServerEnv } from '@/server/env'
import { getRequestId } from '@/server/http/request-id'
import { logInfo, logWarn } from '@/server/observability/logger'
import { runReconcileSince } from '@/server/reconcile/runner'

function getAuthorized(request: Request) {
  const env = getServerEnv()
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const tokenFromQuery = new URL(request.url).searchParams.get('token') ?? undefined
  const expectedTokens = [env.RECONCILE_SECRET, env.CRON_SECRET].filter((value): value is string =>
    Boolean(value)
  )

  if (expectedTokens.length === 0) {
    return false
  }

  return expectedTokens.includes(tokenFromHeader ?? tokenFromQuery ?? '')
}

async function reconcile(request: Request) {
  const requestId = getRequestId(request)

  if (!getAuthorized(request)) {
    logWarn('reconcile.request.rejected', {
      outcome: 'rejected',
      requestId,
    })

    return Response.json(
      {
        ok: false,
        message: 'Unauthorized reconcile request.',
      },
      { status: 401 }
    )
  }

  const url = new URL(request.url)
  const sinceIso =
    url.searchParams.get('since') ?? new Date(Date.now() - 1000 * 60 * 60).toISOString()

  const result = await runReconcileSince(sinceIso)

  logInfo('reconcile.request.complete', {
    outcome: result.degraded ? 'degraded' : 'success',
    cacheTags: result.invalidatedTags,
    requestId,
  })

  return Response.json({
    ok: true,
    sinceIso,
    degraded: result.degraded,
    invalidatedTags: result.invalidatedTags,
  })
}

export const Route = createFileRoute('/api/reconcile/content')({
  server: {
    handlers: {
      GET: async ({ request }) => reconcile(request),
      POST: async ({ request }) => reconcile(request),
    },
  },
})
