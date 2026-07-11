import { getServerEnv } from '@/server/env'
import { logError, logWarn, type LogPayload } from '@/server/observability/logger'

export function captureException(error: unknown, context: LogPayload = {}) {
  const env = getServerEnv()
  const message = error instanceof Error ? error.message : 'Unknown error'

  logError('exception', {
    ...context,
    message,
    stack: error instanceof Error ? error.stack : undefined,
    sentryConfigured: Boolean(env.SENTRY_DSN),
  })
}

export function emitAlert(name: string, context: LogPayload = {}) {
  logWarn(`alert:${name}`, context)
}
