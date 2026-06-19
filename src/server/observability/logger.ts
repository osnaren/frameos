export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogPayload {
  provider?: string
  eventType?: string
  publicId?: string
  slug?: string
  documentId?: string
  cacheTags?: string[]
  idempotencyKey?: string
  requestId?: string
  durationMs?: number
  value?: number
  outcome?: string
  message?: string
  [key: string]: unknown
}

function write(level: LogLevel, event: string, payload: LogPayload) {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  })

  if (level === 'error') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  console.log(line)
}

export function logInfo(event: string, payload: LogPayload = {}) {
  write('info', event, payload)
}

export function logWarn(event: string, payload: LogPayload = {}) {
  write('warn', event, payload)
}

export function logError(event: string, payload: LogPayload = {}) {
  write('error', event, payload)
}

export function recordMetric(metric: string, value: number, payload: LogPayload = {}) {
  write('info', `metric:${metric}`, {
    ...payload,
    value,
  })
}
