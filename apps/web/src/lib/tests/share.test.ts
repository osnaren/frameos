import { describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from '@/lib/share'

const payload = { url: 'https://example.com/photos/the-sea', title: 'The sea' }

function abortError() {
  const error = new Error('cancelled')
  error.name = 'AbortError'
  return error
}

describe('shareOrCopy', () => {
  it('uses the native share sheet when available', async () => {
    const share = vi.fn(async () => {})
    const writeClipboard = vi.fn(async () => {})

    expect(await shareOrCopy(payload, { share, writeClipboard })).toBe('shared')
    expect(share).toHaveBeenCalledWith(payload)
    expect(writeClipboard).not.toHaveBeenCalled()
  })

  it('treats a cancelled share sheet as dismissed, not as a failure', async () => {
    const share = vi.fn(async () => {
      throw abortError()
    })
    const writeClipboard = vi.fn(async () => {})

    expect(await shareOrCopy(payload, { share, writeClipboard })).toBe('dismissed')
    expect(writeClipboard).not.toHaveBeenCalled()
  })

  it('copies the link when sharing is unavailable or fails', async () => {
    const writeClipboard = vi.fn(async () => {})
    expect(await shareOrCopy(payload, { writeClipboard })).toBe('copied')
    expect(writeClipboard).toHaveBeenCalledWith(payload.url)

    const share = vi.fn(async () => {
      throw new Error('NotAllowedError')
    })
    expect(await shareOrCopy(payload, { share, writeClipboard })).toBe('copied')
  })

  it('skips sharing when canShare rejects the payload', async () => {
    const share = vi.fn(async () => {})
    expect(
      await shareOrCopy(payload, { share, canShare: () => false, legacyCopy: () => true })
    ).toBe('copied')
    expect(share).not.toHaveBeenCalled()
  })

  it('falls back to the legacy copy, then reports failure', async () => {
    const writeClipboard = vi.fn(async () => {
      throw new Error('denied')
    })
    expect(await shareOrCopy(payload, { writeClipboard, legacyCopy: () => true })).toBe('copied')
    expect(await shareOrCopy(payload, { writeClipboard, legacyCopy: () => false })).toBe('failed')
    expect(await shareOrCopy(payload, {})).toBe('failed')
  })
})
