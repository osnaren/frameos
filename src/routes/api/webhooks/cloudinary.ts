import { createFileRoute } from '@tanstack/react-router'

import {
  claimIdempotencyKey,
  createFingerprint,
  shouldProcessNewerEvent,
} from '@/server/cache/idempotency'
import { getRequestId } from '@/server/http/request-id'
import { logInfo, logWarn } from '@/server/observability/logger'
import { createCloudinaryProvider } from '@/server/providers/cloudinary'
import { createPortfolioRepository } from '@/server/repository/portfolio'

const provider = createCloudinaryProvider()
const repository = createPortfolioRepository()

export const Route = createFileRoute('/api/webhooks/cloudinary')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text()
        const requestId = getRequestId(request)

        logInfo('webhook.cloudinary.received', {
          provider: 'cloudinary',
          requestId,
        })

        const verification = await provider.verifyWebhook(request, bodyText)

        if (!verification.ok) {
          logWarn('webhook.cloudinary.rejected', {
            provider: 'cloudinary',
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
        const idempotencyKey = `cloudinary:${createFingerprint(verification.fingerprint ?? bodyText)}`
        const claimed = await claimIdempotencyKey(idempotencyKey)

        if (!claimed) {
          logInfo('webhook.cloudinary.skipped', {
            provider: 'cloudinary',
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

        if (verification.publicId && verification.timestamp) {
          const isNewer = await shouldProcessNewerEvent(
            `cloudinary:${verification.publicId}`,
            verification.timestamp
          )

          if (!isNewer) {
            logInfo('webhook.cloudinary.skipped', {
              provider: 'cloudinary',
              idempotencyKey,
              outcome: 'stale-event',
              publicId: verification.publicId,
              requestId,
            })

            return Response.json({
              ok: true,
              skipped: true,
              reason: 'stale-event',
            })
          }
        }

        const result = await repository.reconcileFromWebhook('cloudinary', payload)

        logInfo('webhook.cloudinary.processed', {
          provider: 'cloudinary',
          eventType: verification.eventType,
          publicId: verification.publicId,
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
