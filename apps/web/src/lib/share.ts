/**
 * Share a link the best way the device allows: the native share sheet where
 * there is one (most phones), otherwise the clipboard, otherwise a legacy
 * copy for non-secure contexts. Dependencies are injectable for tests.
 */
export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed'

export interface SharePayload {
  url: string
  title?: string
  text?: string
}

export interface ShareEnvironment {
  share?: (data: SharePayload) => Promise<void>
  canShare?: (data: SharePayload) => boolean
  writeClipboard?: (text: string) => Promise<void>
  legacyCopy?: (text: string) => boolean
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export async function shareOrCopy(
  payload: SharePayload,
  environment: ShareEnvironment
): Promise<ShareOutcome> {
  const { share, canShare, writeClipboard, legacyCopy } = environment

  if (share && (!canShare || canShare(payload))) {
    try {
      await share(payload)
      return 'shared'
    } catch (error) {
      // The visitor closed the share sheet — that's a choice, not a failure.
      if (isAbort(error)) {
        return 'dismissed'
      }
    }
  }

  if (writeClipboard) {
    try {
      await writeClipboard(payload.url)
      return 'copied'
    } catch {
      // Fall through to the legacy path (e.g. clipboard permission denied).
    }
  }

  if (legacyCopy?.(payload.url)) {
    return 'copied'
  }

  return 'failed'
}

/** execCommand('copy') fallback for http:// previews and older browsers. */
export function legacyCopyToClipboard(text: string) {
  if (typeof document === 'undefined') {
    return false
  }

  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}

/** The real browser environment (only call from event handlers). */
export function browserShareEnvironment(options: { preferNative: boolean }): ShareEnvironment {
  const nav = typeof navigator === 'undefined' ? undefined : navigator

  return {
    share: options.preferNative && nav?.share ? (data) => nav.share(data) : undefined,
    canShare: nav?.canShare ? (data) => nav.canShare(data) : undefined,
    // `clipboard` is missing on insecure (http://) origins despite the DOM typings.
    writeClipboard: nav && 'clipboard' in nav ? (text) => nav.clipboard.writeText(text) : undefined,
    legacyCopy: legacyCopyToClipboard,
  }
}
