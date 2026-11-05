import { useState } from 'react'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { IDENTITY_ZOOM, zoomFromKey, type ZoomState } from '@/lib/gestures'
import { containedImageSizes } from '@/lib/image-policy'

import { ZoomablePhoto, ZoomToggle } from './ZoomablePhoto'

import type { Photo } from '@/types/photo'

/**
 * Full-screen inspection for the photo page: the photograph as large as the
 * screen allows, with zoom, pan, and paging that carries on through the
 * world without leaving full screen (the page underneath follows along).
 */
export function PhotoViewerDialog({
  photo,
  open,
  onOpenChange,
  onPage,
  hasPrevious,
  hasNext,
  counter,
}: {
  photo: Photo
  open: boolean
  onOpenChange: (open: boolean) => void
  onPage: (direction: -1 | 1) => void
  hasPrevious: boolean
  hasNext: boolean
  /** e.g. "03 / 05" */
  counter?: string
}) {
  const [zoomEntry, setZoomEntry] = useState<{ slug: string; zoom: ZoomState } | null>(null)
  const zoom = zoomEntry?.slug === photo.slug ? zoomEntry.zoom : IDENTITY_ZOOM
  const setZoom = (next: ZoomState) => setZoomEntry({ slug: photo.slug, zoom: next })
  const sizes = containedImageSizes(photo.metadata.width, photo.metadata.height, [
    { maxWidths: ['calc(100vw - 2rem)'], maxHeights: ['calc(100vh - 9rem)'] },
  ])

  const page = (direction: -1 | 1) => {
    if ((direction === -1 && hasPrevious) || (direction === 1 && hasNext)) {
      onPage(direction)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent
          showCloseButton={false}
          overlayClassName="archive-lightbox-overlay"
          className="archive-lightbox-content photo-viewer-content"
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return

            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              page(event.key === 'ArrowLeft' ? -1 : 1)
              return
            }

            const frame = event.currentTarget.querySelector<HTMLElement>('.zoomable-photo')
            const next = zoomFromKey(event.key, zoom, {
              width: frame?.clientWidth ?? 0,
              height: frame?.clientHeight ?? 0,
            })
            if (next) {
              event.preventDefault()
              setZoom(next)
            }
          }}
        >
          <div className="archive-lightbox-chrome">
            <DialogTitle className="photo-viewer-title">{photo.title}</DialogTitle>
            {counter ? <span aria-hidden="true">{counter}</span> : null}
          </div>
          <DialogDescription className="sr-only">
            Full-screen view. Double-click, pinch or use the zoom button to look closer; drag to
            move around while zoomed; arrow keys move between photographs.
          </DialogDescription>

          <div className="photo-viewer-stage">
            <ZoomablePhoto
              photo={photo}
              sizes={sizes}
              zoom={zoom}
              onZoomChange={setZoom}
              onSwipe={page}
              className="photo-viewer-photo"
            />
          </div>

          <div className="archive-lightbox-controls">
            <button
              type="button"
              className="archive-lightbox-nav"
              onClick={() => page(-1)}
              disabled={!hasPrevious}
              aria-label="Previous photograph"
              aria-keyshortcuts="ArrowLeft"
            >
              <ArrowLeft aria-hidden="true" />
              <span>Previous</span>
            </button>
            <div className="archive-lightbox-actions">
              <ZoomToggle zoom={zoom} onZoomChange={setZoom} className="archive-lightbox-zoom" />
            </div>
            <button
              type="button"
              className="archive-lightbox-nav archive-lightbox-nav--next"
              onClick={() => page(1)}
              disabled={!hasNext}
              aria-label="Next photograph"
              aria-keyshortcuts="ArrowRight"
            >
              <span>Next</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          <DialogClose className="archive-lightbox-close" aria-label="Exit full screen">
            <X aria-hidden="true" />
            <span>Close</span>
          </DialogClose>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
