import { captureException } from '@/server/observability/error-tracker'
import { logInfo } from '@/server/observability/logger'
import { createPortfolioRepository } from '@/server/repository/portfolio'

const repository = createPortfolioRepository()

export async function runReconcileSince(sinceIso: string) {
  const startedAt = Date.now()

  try {
    logInfo('reconcile.run.start', {
      sinceIso,
    })

    const result = await repository.reconcileSince(sinceIso)

    logInfo('reconcile.run.complete', {
      durationMs: Date.now() - startedAt,
      outcome: result.degraded ? 'degraded' : 'success',
      cacheTags: result.invalidatedTags,
      sinceIso,
    })

    return result
  } catch (error) {
    captureException(error, {
      outcome: 'reconcile-run-failed',
      sinceIso,
    })
    throw error
  }
}
