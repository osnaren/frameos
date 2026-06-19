import { createFileRoute } from '@tanstack/react-router'

import {
  claimIdempotencyKey,
  createFingerprint,
  shouldProcessNewerEvent,
} from '@/server/cache/idempotency'
import { getRequestId } from '@/server/http/request-id'
import { logInfo, logWarn } from '@/server/observability/logger'
import { createSanityProvider } from '@/server/providers/sanity'
import { createPortfolioRepository } from '@/server/repository/portfolio'

const provider = createSanityProvider()
const repository = createPortfolioRepository()

export const Route = createFileRoute('/api/webhooks/sanity')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text()
        const requestId = getRequestId(request)

        logInfo('webhook.sanity.received', {
          provider: 'sanity',
          requestId,
        })

        const verification = await provider.verifyWebhook(request, bodyText)

        if (!verification.ok) {
          logWarn('webhook.sanity.rejected', {
            provider: 'sanity',
            outcome: 'rejected',
            message: verification.reason,
            requestId,
          })

          return Response.json(
            {
              ok: false,
              message: verification.reason,
            },
            { status: 401 }
          )
        }

        const payload = JSON.parse(bodyText) as Record<string, unknown>
        const idempotencyKey =
          verification.idempotencyKey ??
          `sanity:${createFingerprint(verification.documentId ?? bodyText)}`
        const claimed = await claimIdempotencyKey(idempotencyKey)

        if (!claimed) {
          logInfo('webhook.sanity.skipped', {
            provider: 'sanity',
            documentId: verification.documentId,
            idempotencyKey,
            outcome: 'duplicate-event',
            requestId,
          })

          return Response.json({
            ok: true,
            skipped: true,
            reason: 'duplicate-event',
          })
        }

        if (verification.documentId && verification.updatedAt) {
          const isNewer = await shouldProcessNewerEvent(
            `sanity:${verification.documentId}`,
            verification.updatedAt
          )

          if (!isNewer) {
            logInfo('webhook.sanity.skipped', {
              provider: 'sanity',
              documentId: verification.documentId,
              idempotencyKey,
              outcome: 'stale-event',
              requestId,
            })

            return Response.json({
              ok: true,
              skipped: true,
              reason: 'stale-event',
            })
          }
        }

        const result = await repository.reconcileFromWebhook('sanity', {
          ...payload,
          documentId: verification.documentId,
        })

        logInfo('webhook.sanity.processed', {
          provider: 'sanity',
          documentId: verification.documentId,
          idempotencyKey,
          cacheTags: result.invalidatedTags,
          outcome: result.degraded ? 'degraded' : 'success',
          requestId,
        })

        return Response.json({
          ok: true,
          degraded: result.degraded,
          invalidatedTags: result.invalidatedTags,
        })
      },
    },
  },
})
