import {
  buildSanityImageUrl,
  buildSanitySrcSet,
  getImagePresetDefinition,
  type ImagePreset,
  type SanityImageHotspot,
} from '@/lib/image-policy'
import { getLocalPhotoAsset } from '@/lib/local-photos'

import type { CSSProperties } from 'react'

export interface PhotoImageProps {
  /** Local fixture id (`local/<id>`) or a Sanity image CDN base URL. */
  publicId: string
  alt: string
  preset: ImagePreset
  className?: string
  sizes?: string
  priority?: boolean
  intrinsicWidth?: number
  intrinsicHeight?: number
  /** Base64 blur placeholder from Sanity's asset metadata (`Photo.image.lqip`). */
  lqip?: string
  /** Editor-set focal point from Sanity's asset metadata (`Photo.image.hotspot`). */
  hotspot?: SanityImageHotspot
  style?: CSSProperties
}

/**
 * The single rendering path for every photograph. Local archive photos
 * (`local/<id>`) resolve to bundled responsive WebP variants; everything else
 * is a Sanity CDN base URL run through the Sanity image policy.
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
  hotspot,
  style,
}: PhotoImageProps) {
  const presetDefinition = getImagePresetDefinition(preset)
  const intrinsicAspectRatio =
    intrinsicWidth && intrinsicHeight ? `${intrinsicWidth} / ${intrinsicHeight}` : undefined
  const local = getLocalPhotoAsset(publicId)

  if (local) {
    return (
      <img
        alt={alt}
        className={className}
        src={local.src}
        srcSet={local.srcSet}
        sizes={sizes ?? presetDefinition.sizes}
        width={local.width}
        height={local.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={false}
        style={{
          backgroundImage: `url(${local.placeholder})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          ...style,
        }}
      />
    )
  }

  if (!publicId) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          aspectRatio: intrinsicAspectRatio ?? presetDefinition.aspectRatio ?? undefined,
          ...style,
        }}
      />
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      src={buildSanityImageUrl({ baseUrl: publicId, preset, hotspot })}
      srcSet={buildSanitySrcSet({ baseUrl: publicId, preset, hotspot })}
      sizes={sizes ?? presetDefinition.sizes}
      width={intrinsicWidth ?? presetDefinition.width}
      height={intrinsicHeight ?? presetDefinition.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={false}
      style={{
        backgroundImage: lqip ? `url(${lqip})` : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        aspectRatio: intrinsicAspectRatio ?? presetDefinition.aspectRatio ?? undefined,
        ...style,
      }}
    />
  )
}
