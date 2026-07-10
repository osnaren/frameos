import { Link } from '@tanstack/react-router'

import { PhotoImage } from '@/components/photo/PhotoImage'
import type { ImagePreset } from '@/lib/image-policy'
import type { Photo } from '@/types/photo'

export interface PhotoFrameProps {
  photo: Photo
  preset?: ImagePreset
  sizes?: string
  priority?: boolean
  /** 1-based frame number within its world, shown as a contact-sheet mark */
  frameNumber?: number
  showCaption?: boolean
  className?: string
  imageClassName?: string
}

/**
 * The pocket frame: every photograph on a scene or sheet is one of these.
 * Links to the photo's stable URL and carries a view-transition name so the
 * same visual object morphs into the detail view.
 */
export function PhotoFrame({
  photo,
  preset = 'detail',
  sizes,
  priority = false,
  frameNumber,
  showCaption = true,
  className,
  imageClassName,
}: PhotoFrameProps) {
  return (
    <figure className={`m-0 ${className ?? ''}`}>
      <Link
        to="/photos/$slug"
        params={{ slug: photo.slug }}
        aria-label={`View “${photo.title}”`}
        className="pocket-frame block no-underline"
        style={{ viewTransitionName: `photo-${photo.slug.replace(/[^a-z0-9-]/gi, '')}` }}
      >
        <PhotoImage
          publicId={photo.publicId}
          alt={photo.alt}
          preset={preset}
          sizes={sizes}
          priority={priority}
          className={imageClassName ?? 'h-auto w-full'}
        />
        <span aria-hidden="true" className="frame-corners" />
      </Link>
      {showCaption ? (
        <figcaption className="mt-3 flex items-baseline gap-3">
          {frameNumber !== undefined ? (
            <span className="mono-label shrink-0">№ {String(frameNumber).padStart(2, '0')}</span>
          ) : null}
          <span className="display-italic text-[1.05rem] leading-6 text-[var(--muted-strong)]">
            {photo.title}
          </span>
        </figcaption>
      ) : null}
    </figure>
  )
}
