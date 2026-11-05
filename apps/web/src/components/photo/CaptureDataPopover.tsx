import { useId, useState, useSyncExternalStore } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buildCaptureDetails, capturePalette, hasCameraExif } from '@/lib/capture-details'

import type { Photo } from '@/types/photo'

const COMPACT_QUERY = '(max-width: 640px)'

function subscribeToCompact(onChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * The photograph's capture-data readout, opened from the glowing contact
 * point on the frame. Lists only what this file actually carries (see
 * lib/capture-details) plus its measured palette. Radix handles Esc,
 * click-away, focus moving in and back to the trigger, and keeping the card
 * inside the viewport; on phones it opens above the point rather than beside
 * it so it never runs off-screen.
 */
export function CaptureDataPopover({ photo }: { photo: Photo }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const compact = useSyncExternalStore(
    subscribeToCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false
  )
  const details = buildCaptureDetails(photo)
  const palette = capturePalette(photo)
  const cameraExif = hasCameraExif(photo)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="photo-metadata-hotspot" aria-label="Capture data">
          <span aria-hidden="true" />
          <span className="photo-metadata-hotspot-label" aria-hidden="true">
            Capture data
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={compact ? 'top' : 'left'}
        align={compact ? 'end' : 'center'}
        sideOffset={14}
        collisionPadding={16}
        aria-labelledby={titleId}
        className="photo-metadata-popover w-[min(22rem,calc(100vw-2rem))] p-0"
      >
        <div className="photo-metadata-popover-head">
          <p className="photo-metadata-kicker">Digital contact point</p>
          <h2 id={titleId} className="photo-metadata-title display-font">
            Capture data
          </h2>
          <p className="photo-metadata-subtitle">
            {cameraExif ? 'Read from the file’s own metadata.' : 'Measured from the archived file.'}
          </p>
        </div>

        {details.length > 0 ? (
          <dl className="photo-metadata-grid">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd title={detail.value}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {palette.length > 0 ? (
          <div className="photo-metadata-palette">
            <p id={`${titleId}-palette`}>Palette</p>
            <ul aria-labelledby={`${titleId}-palette`}>
              {palette.map((colour) => (
                <li key={colour}>
                  <span aria-hidden="true" style={{ background: colour }} />
                  <code>{colour}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!cameraExif ? (
          <p className="photo-metadata-note display-italic">
            This one didn&rsquo;t keep its camera settings — just the frame itself.
          </p>
        ) : null}
        <p className="photo-metadata-dismiss" aria-hidden="true">
          Esc or tap outside to close
        </p>
      </PopoverContent>
    </Popover>
  )
}
