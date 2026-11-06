import { randomUUID } from 'node:crypto'

const REQUEST_ID_HEADERS = ['x-request-id', 'x-vercel-id', 'cf-ray', 'traceparent'] as const

export function getRequestId(request: Request) {
  for (const header of REQUEST_ID_HEADERS) {
    const value = request.headers.get(header)

    if (value) {
      return value
    }
  }

  return randomUUID()
}
