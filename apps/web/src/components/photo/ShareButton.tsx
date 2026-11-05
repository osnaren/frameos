import { useEffect, useState } from 'react'

import { Share2 } from 'lucide-react'
import { createPortal } from 'react-dom'

import { browserShareEnvironment, shareOrCopy, type ShareOutcome } from '@/lib/share'

const MESSAGES: Partial<Record<ShareOutcome, string>> = {
  copied: 'Link copied',
  failed: 'Couldn’t copy — the link is in your address bar',
}

/**
 * Share a photograph: the native share sheet on touch devices, a copied link
 * (with a small toast) everywhere else.
 */
export function ShareButton({
  url,
  title,
  text,
  className,
}: {
  url: string
  title: string
  text?: string
  className?: string
}) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleShare = async () => {
    const outcome = await shareOrCopy(
      { url, title, text },
      browserShareEnvironment({
        // Desktop share sheets are clumsy; a copied link is what people expect there.
        preferNative: window.matchMedia('(pointer: coarse)').matches,
      })
    )
    const message = MESSAGES[outcome]
    if (message) {
      setToast({ message, id: Date.now() })
    }
  }

  return (
    <>
      <button type="button" onClick={() => void handleShare()} className={className}>
        <Share2 aria-hidden="true" />
        <span>Share</span>
      </button>
      {/* Always mounted, so screen readers reliably announce the change. */}
      <span className="sr-only" role="status" aria-live="polite">
        {toast?.message ?? ''}
      </span>
      {toast
        ? createPortal(
            <div key={toast.id} className="site-toast" aria-hidden="true">
              {toast.message}
            </div>,
            document.body
          )
        : null}
    </>
  )
}
