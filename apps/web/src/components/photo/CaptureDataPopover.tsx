import { useEffect, useId, useState, useSyncExternalStore } from 'react'

import { Check } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  buildCaptureSections,
  capturePalette,
  exposureSummary,
  hasCameraExif,
} from '@/lib/capture-details'
import { legacyCopyToClipboard } from '@/lib/share'

import type { Photo } from '@/types/photo'

const COMPACT_QUERY = '(max-width: 640px)'
const COARSE_QUERY = '(pointer: coarse)'

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return legacyCopyToClipboard(text)
  }
}

/**
 * The photograph's capture-data readout, opened from the glowing contact
 * point on the frame (or the I key). Lists only what this file actually
 * carries (see lib/capture-details), grouped as exposure / when & where /
 * file, plus its measured palette — each swatch copies its hex value.
 *
 * Radix handles Esc, click-away, focus moving in and back to the trigger,
 * and keeping the card inside the viewport. On wide screens it opens beside
 * the frame (into the margin, flipping when there's no room); on phones it
 * opens above the point so it never runs off-screen.
 */
export function CaptureDataPopover({
  photo,
  open,
  onOpenChange,
}: {
  photo: Photo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const titleId = useId()
  const compact = useMediaQuery(COMPACT_QUERY)
  const coarse = useMediaQuery(COARSE_QUERY)
  const [copied, setCopied] = useState<string | null>(null)
  const sections = buildCaptureSections(photo)
  const exposure = exposureSummary(photo)
  const palette = capturePalette(photo)
  const cameraExif = hasCameraExif(photo)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = async (colour: string) => {
    if (await copyText(colour)) {
      setCopied(colour)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="photo-metadata-hotspot"
          aria-label="Capture data"
          aria-keyshortcuts="I"
        >
          <span aria-hidden="true" />
          <span className="photo-metadata-hotspot-label" aria-hidden="true">
            Capture data
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={compact ? 'top' : 'right'}
        align="end"
        sideOffset={compact ? 14 : 22}
        collisionPadding={16}
        aria-labelledby={titleId}
        className="photo-metadata-popover w-[min(23rem,calc(100vw-2rem))] p-0"
        // Focus the card, not the first palette swatch, so opening it doesn't
        // look like a swatch was selected. Tab still reaches every swatch.
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
        }}
        onKeyDown={(event) => {
          // I closes it again, matching the key that opened it.
          if ((event.key === 'i' || event.key === 'I') && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            onOpenChange(false)
          }
        }}
      >
        <div className="photo-metadata-popover-head">
          <p className="photo-metadata-kicker">Digital contact point</p>
          <h2 id={titleId} className="photo-metadata-title display-font">
            Capture data
          </h2>
          <p className="photo-metadata-subtitle">
            {cameraExif ? 'Read from the file’s own metadata.' : 'Measured from the archived file.'}
          </p>
          {exposure ? (
            <p className="photo-metadata-exposure" aria-label={`Exposure: ${exposure}`}>
              {exposure}
            </p>
          ) : null}
        </div>

        {sections.map((section) => (
          <section
            key={section.title}
            className="photo-metadata-section"
            aria-label={section.title}
          >
            <h3 className="photo-metadata-section-title">{section.title}</h3>
            <dl className="photo-metadata-grid">
              {section.rows.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd title={detail.value}>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {palette.length > 0 ? (
          <div className="photo-metadata-palette">
            <p id={`${titleId}-palette`}>
              Palette <span aria-hidden="true">· {coarse ? 'tap' : 'click'} to copy</span>
            </p>
            <ul aria-labelledby={`${titleId}-palette`}>
              {palette.map((colour) => (
                <li key={colour}>
                  <button
                    type="button"
                    onClick={() => void handleCopy(colour)}
                    aria-label={`Copy ${colour}`}
                    data-copied={copied === colour ? '' : undefined}
                  >
                    <span aria-hidden="true" style={{ background: colour }}>
                      {copied === colour ? <Check /> : null}
                    </span>
                    <code>{copied === colour ? 'Copied' : colour}</code>
                  </button>
                </li>
              ))}
            </ul>
            <span className="sr-only" role="status" aria-live="polite">
              {copied ? `Copied ${copied}` : ''}
            </span>
          </div>
        ) : null}

        {!cameraExif ? (
          <p className="photo-metadata-note display-italic">
            This one didn&rsquo;t keep its camera settings — just the frame itself.
          </p>
        ) : null}
        <p className="photo-metadata-dismiss" aria-hidden="true">
          {coarse ? (
            'Tap outside to close'
          ) : (
            <>
              <kbd>I</kbd> or <kbd>Esc</kbd> to close
            </>
          )}
        </p>
      </PopoverContent>
    </Popover>
  )
}
