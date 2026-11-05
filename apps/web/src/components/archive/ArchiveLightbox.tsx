import { useEffect, useRef, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react'

import { ZoomablePhoto, ZoomToggle } from '@/components/photo/ZoomablePhoto'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCaptureDate } from '@/lib/capture-details'
import { IDENTITY_ZOOM, zoomFromKey, type ZoomState } from '@/lib/gestures'
import { containedImageSizes } from '@/lib/image-policy'
import { photoOriginState, type PhotoOrigin } from '@/lib/photo-origin'
import { preloadPhoto, resolvePhotoSources } from '@/lib/photo-sources'

import type { World } from '@/types/content'
import type { Photo, PhotoCardView } from '@/types/photo'

interface ArchiveLightboxProps {
  items: PhotoCardView[]
  worlds: World[]
  /** Index into `items` of the open frame, or null when closed. */
  activeIndex: number | null
  onNavigate: (index: number) => void
  onClose: () => void
  /**
   * Where the "full photo page" should send the visitor back to. When the
   * lightbox's own history entry was pushed (`viaHistory`), the link replaces
   * it, so Back from the photo page lands on the Index exactly as it was.
   */
  detailOrigin: PhotoOrigin
  /** Called after closing with the slug last shown, so focus can return to its tile. */
  onRestoreFocus: (slug: string) => void
}

/** Matches the lightbox CSS: one column ≤800px (58dvh tall), image beside the caption above. */
function lightboxSizes(photo: Photo) {
  return containedImageSizes(photo.metadata.width, photo.metadata.height, [
    { media: '(max-width: 800px)', maxWidths: ['calc(100vw - 2rem)'], maxHeights: ['58vh'] },
    { maxWidths: ['calc(100vw - 27rem)'], maxHeights: ['70vh', '56rem'] },
  ])
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * The Index's darkroom viewer. Open state lives in the URL (`?frame=<slug>`),
 * so the system back button closes it, a link to one frame is shareable, and
 * paging replaces rather than stacks history. Radix provides the focus trap,
 * Esc, scroll lock and inert background.
 */
export function ArchiveLightbox({
  items,
  worlds,
  activeIndex,
  onNavigate,
  onClose,
  detailOrigin,
  onRestoreFocus,
}: ArchiveLightboxProps) {
  const item = activeIndex === null ? null : items[activeIndex]
  const photo = item?.photo
  const lastSlug = useRef<string | null>(null)
  const [zoomEntry, setZoomEntry] = useState<{ slug: string; zoom: ZoomState } | null>(null)
  const zoom = photo && zoomEntry?.slug === photo.slug ? zoomEntry.zoom : IDENTITY_ZOOM
  const stageRef = useRef<HTMLDivElement>(null)

  if (photo) {
    lastSlug.current = photo.slug
  }

  const setZoom = (next: ZoomState) => {
    if (photo) {
      setZoomEntry({ slug: photo.slug, zoom: next })
    }
  }

  const page = (direction: -1 | 1) => {
    if (activeIndex === null || items.length < 2) {
      return
    }
    onNavigate((activeIndex + direction + items.length) % items.length)
  }

  // Warm the neighbours so paging shows a sharp frame immediately.
  useEffect(() => {
    if (activeIndex === null || items.length < 2) {
      return
    }

    const neighbours = [
      items[(activeIndex + 1) % items.length],
      items[(activeIndex - 1 + items.length) % items.length],
    ]
    const timer = window.setTimeout(() => {
      for (const neighbour of neighbours) {
        preloadPhoto(
          resolvePhotoSources({
            publicId: neighbour.photo.publicId,
            preset: 'detail',
            hotspot: neighbour.photo.image?.hotspot,
          }),
          lightboxSizes(neighbour.photo)
        )
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [activeIndex, items])

  const world = photo?.category
    ? (worlds.find((entry) => entry.slug === photo.category) ?? null)
    : null
  const captureDate = formatCaptureDate(photo?.captureDate, 'short')
  const description = photo?.caption ?? photo?.description ?? photo?.alt ?? ''
  const position = activeIndex === null ? 0 : activeIndex + 1

  return (
    <Dialog
      open={Boolean(photo)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {photo && activeIndex !== null ? (
        <DialogContent
          fullscreen
          showCloseButton={false}
          overlayClassName="archive-lightbox-overlay"
          className="archive-lightbox-content"
          style={{ '--lightbox-accent': world?.mood.accent ?? '#e0a65a' } as React.CSSProperties}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (lastSlug.current) onRestoreFocus(lastSlug.current)
          }}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return

            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              page(event.key === 'ArrowLeft' ? -1 : 1)
              return
            }

            const stage = stageRef.current?.querySelector<HTMLElement>('.zoomable-photo')
            const next = zoomFromKey(event.key, zoom, {
              width: stage?.clientWidth ?? 0,
              height: stage?.clientHeight ?? 0,
            })
            if (next) {
              event.preventDefault()
              setZoom(next)
            }
          }}
        >
          <div className="archive-lightbox-chrome">
            <span aria-hidden="true">
              {pad(position)} / {pad(items.length)}
            </span>
            <span className="archive-lightbox-hint" aria-hidden="true">
              ← → browse · double-click to zoom · Esc closes
            </span>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Frame {position} of {items.length}: {photo.title}
          </p>

          <figure className="archive-lightbox-figure">
            <div ref={stageRef} className="archive-lightbox-image-wrap">
              <ZoomablePhoto
                photo={photo}
                sizes={lightboxSizes(photo)}
                zoom={zoom}
                onZoomChange={setZoom}
                onSwipe={page}
                className="archive-lightbox-photo"
              />
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
                    <dd>
                      <Link to="/worlds/$world" params={{ world: world.slug }}>
                        {world.name}
                      </Link>
                    </dd>
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
                {photo.tags.length > 0 ? (
                  <div>
                    <dt>Tags</dt>
                    <dd className="archive-lightbox-tags">
                      {photo.tags.map((tag) => (
                        <Link
                          key={tag}
                          to="/archive"
                          search={{ tag }}
                          resetScroll={false}
                          viewTransition={false}
                        >
                          #{tag}
                        </Link>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </figcaption>
          </figure>

          <div className="archive-lightbox-controls">
            <button
              type="button"
              className="archive-lightbox-nav"
              onClick={() => page(-1)}
              disabled={items.length < 2}
              aria-label="Previous photograph"
              aria-keyshortcuts="ArrowLeft"
            >
              <ArrowLeft aria-hidden="true" />
              <span>Previous</span>
            </button>
            <div className="archive-lightbox-actions">
              <ZoomToggle zoom={zoom} onZoomChange={setZoom} className="archive-lightbox-zoom" />
              <Link
                to="/photos/$slug"
                params={{ slug: photo.slug }}
                replace={detailOrigin.viaHistory}
                state={photoOriginState(detailOrigin)}
                className="archive-lightbox-detail-link"
              >
                Full photo page
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <button
              type="button"
              className="archive-lightbox-nav archive-lightbox-nav--next"
              onClick={() => page(1)}
              disabled={items.length < 2}
              aria-label="Next photograph"
              aria-keyshortcuts="ArrowRight"
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
