import { buildPlaceholderStyle } from '@/lib/image-placeholder'
import {
  getImagePresetDefinition,
  type ImagePreset,
  type SanityImageHotspot,
} from '@/lib/image-policy'
import { getLocalPhotoAsset } from '@/lib/local-photos'
import { resolvePhotoSources } from '@/lib/photo-sources'
import { cn } from '@/lib/utils'

import type { CSSProperties } from 'react'

export interface PhotoImageProps {
  /** Local fixture id (`local/<id>`) or a Sanity image CDN base URL. */
  publicId: string
  alt: string
  preset: ImagePreset
  className?: string
  sizes?: string
  /** The page's LCP image: fetched eagerly at high priority. Everything else lazy-loads. */
  priority?: boolean
  intrinsicWidth?: number
  intrinsicHeight?: number
  /** Base64 blur placeholder from Sanity's asset metadata (`Photo.image.lqip`). */
  lqip?: string
  /** Measured palette (`Photo.metadata.palette`), dominant first — the colour field under the preview. */
  palette?: readonly string[]
  /** Editor-set focal point from Sanity's asset metadata (`Photo.image.hotspot`). */
  hotspot?: SanityImageHotspot
  style?: CSSProperties
}

/**
 * Marks the image once its pixels are decoded, so CSS can let it "develop"
 * (resolve from soft to sharp, like a focus pull) over its own placeholder.
 * Images that were already complete — server-rendered and loaded before
 * hydration, or straight from cache — are marked `instant` and don't animate.
 */
function trackImageLoad(image: HTMLImageElement | null) {
  if (!image) {
    return
  }

  if (image.complete && image.naturalWidth > 0) {
    image.dataset.loaded = 'instant'
    return
  }

  let cancelled = false
  const reveal = () => {
    if (!cancelled) {
      image.dataset.loaded = 'develop'
    }
  }
  const handleLoad = () => {
    // decode() resolves once the bitmap is ready to paint, so the animation
    // never starts on a frame that is still blank.
    void image.decode().then(reveal, reveal)
  }
  const handleError = () => {
    image.dataset.loaded = 'error'
  }

  image.addEventListener('load', handleLoad, { once: true })
  image.addEventListener('error', handleError, { once: true })

  return () => {
    cancelled = true
    image.removeEventListener('load', handleLoad)
    image.removeEventListener('error', handleError)
  }
}

/**
 * The single rendering path for every photograph. Local archive photos
 * (`local/<id>`) resolve to bundled responsive WebP variants; everything else
 * is a Sanity CDN base URL run through the Sanity image policy.
 *
 * Every photo reserves its space up front (width/height attributes plus an
 * aspect-ratio), paints a blurred preview of itself over its dominant colour
 * while the file loads, then develops into focus once decoded.
 */
export function PhotoImage({
  publicId,
  alt,
  preset,
  className,
  sizes,
  priority = false,
  intrinsicWidth,
  intrinsicHeight,
  lqip,
  palette,
  hotspot,
  style,
}: PhotoImageProps) {
  const presetDefinition = getImagePresetDefinition(preset)
  const local = getLocalPhotoAsset(publicId)
  // Module-level, so it is already a stable ref callback.
  const ref = trackImageLoad

  // Local variants are always the whole frame; a Sanity `crop` preset is
  // delivered in the preset's own shape, whatever the original's.
  const croppedByPreset = !local && presetDefinition.fit === 'crop'
  const width = local
    ? local.width
    : croppedByPreset
      ? presetDefinition.width
      : intrinsicWidth || undefined
  const height = local
    ? local.height
    : croppedByPreset
      ? presetDefinition.height
      : intrinsicHeight || undefined
  const aspectRatio =
    width && height ? `${width} / ${height}` : (presetDefinition.aspectRatio ?? undefined)
  const placeholder = buildPlaceholderStyle({
    preview: local?.placeholder ?? lqip,
    palette: local?.palette ?? palette,
    width,
    height,
  })

  const sources = resolvePhotoSources({ publicId, preset, hotspot })

  if (!sources) {
    return (
      <div
        aria-hidden="true"
        className={cn('photo-image', className)}
        style={{ aspectRatio, ...placeholder, ...style }}
      />
    )
  }

  return (
    <img
      // A new element per source, so a reused component never shows the
      // previous photo (or skips the develop) while the next one loads.
      key={sources.src}
      ref={ref}
      alt={alt}
      className={cn('photo-image', className)}
      src={sources.src}
      srcSet={sources.srcSet}
      sizes={sizes ?? presetDefinition.sizes}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'auto' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      draggable={false}
      style={{ aspectRatio, ...placeholder, ...style }}
    />
  )
}
