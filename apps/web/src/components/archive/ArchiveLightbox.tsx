import { useCallback, useEffect } from 'react'

import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react'

import { PhotoImage } from '@/components/photo/PhotoImage'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

import type { World } from '@/types/content'
import type { PhotoCardView } from '@/types/photo'

interface ArchiveLightboxProps {
  items: PhotoCardView[]
  worlds: World[]
  activeIndex: number | null
  onIndexChange: (index: number | null) => void
}

function formatCaptureDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date)
}

export function ArchiveLightbox({
  items,
  worlds,
  activeIndex,
  onIndexChange,
}: ArchiveLightboxProps) {
  const item = activeIndex === null ? null : items[activeIndex]
  const photo = item?.photo

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (activeIndex === null || items.length < 2) return
      onIndexChange((activeIndex + direction + items.length) % items.length)
    },
    [activeIndex, items.length, onIndexChange]
  )

  useEffect(() => {
    if (activeIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        navigate(-1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        navigate(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, navigate])

  const world = photo?.category
    ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
    : null
  const captureDate = formatCaptureDate(photo?.captureDate)
  const description = photo?.caption ?? photo?.description ?? photo?.alt ?? ''

  return (
    <Dialog
      open={Boolean(photo)}
      onOpenChange={(open) => {
        if (!open) onIndexChange(null)
      }}
    >
      {photo && activeIndex !== null ? (
        <DialogContent
          showCloseButton={false}
          overlayClassName="archive-lightbox-overlay"
          className="archive-lightbox-content"
          style={{ '--lightbox-accent': world?.mood.accent ?? '#e0a65a' } as React.CSSProperties}
        >
          <div className="archive-lightbox-chrome" aria-hidden="true">
            <span>FRAME {String(activeIndex + 1).padStart(2, '0')}</span>
            <span>{String(items.length).padStart(2, '0')} EXPOSURES</span>
          </div>

          <figure className="archive-lightbox-figure">
            <div className="archive-lightbox-image-wrap">
              <PhotoImage
                publicId={photo.publicId}
                alt={photo.alt}
                preset="detail"
                sizes="(max-width: 900px) 94vw, 76vw"
                intrinsicWidth={photo.metadata.width || undefined}
                intrinsicHeight={photo.metadata.height || undefined}
                lqip={photo.image?.lqip}
                hotspot={photo.image?.hotspot}
                className="archive-lightbox-image"
              />
              <span className="archive-lightbox-focus archive-lightbox-focus--tl" />
              <span className="archive-lightbox-focus archive-lightbox-focus--tr" />
              <span className="archive-lightbox-focus archive-lightbox-focus--bl" />
              <span className="archive-lightbox-focus archive-lightbox-focus--br" />
            </div>

            <figcaption className="archive-lightbox-caption">
              <div>
                <DialogTitle className="archive-lightbox-title">{photo.title}</DialogTitle>
                <DialogDescription className="archive-lightbox-description">
                  {description}
                </DialogDescription>
              </div>
              <dl className="archive-lightbox-metadata">
                {world ? (
                  <div>
                    <dt>World</dt>
                    <dd>{world.name}</dd>
                  </div>
                ) : null}
                {photo.locationLabel ? (
                  <div>
                    <dt>Place</dt>
                    <dd>{photo.locationLabel}</dd>
                  </div>
                ) : null}
                {captureDate ? (
                  <div>
                    <dt>Made</dt>
                    <dd>{captureDate}</dd>
                  </div>
                ) : null}
              </dl>
            </figcaption>
          </figure>

          <div className="archive-lightbox-controls">
            <button
              type="button"
              className="archive-lightbox-nav"
              onClick={() => navigate(-1)}
              aria-label="Previous photograph"
            >
              <ArrowLeft aria-hidden="true" />
              <span>Previous</span>
            </button>
            <Link
              to="/photos/$slug"
              params={{ slug: photo.slug }}
              className="archive-lightbox-detail-link"
            >
              Full field note
              <ExternalLink aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="archive-lightbox-nav archive-lightbox-nav--next"
              onClick={() => navigate(1)}
              aria-label="Next photograph"
            >
              <span>Next</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          <DialogClose className="archive-lightbox-close" aria-label="Close photograph">
            <X aria-hidden="true" />
            <span>Close</span>
          </DialogClose>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
