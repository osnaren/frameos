import {
  buildCloudinaryImageUrl,
  buildCloudinaryPlaceholder,
  buildCloudinarySrcSet,
  getImagePresetDefinition,
  type ImagePreset,
} from '@/lib/image-policy'
import { getLocalPhotoAsset } from '@/lib/local-photos'

import type { CSSProperties } from 'react'

function getCloudName() {
  return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || (import.meta.env.DEV ? 'demo' : '')
}

export interface PhotoImageProps {
  publicId: string
  alt: string
  preset: ImagePreset
  className?: string
  sizes?: string
  priority?: boolean
  style?: CSSProperties
}

/**
 * The single rendering path for every photograph. Local archive photos
 * (`local/<id>`) resolve to bundled responsive WebP variants; everything else
 * flows through the Cloudinary image policy.
 */
export function PhotoImage({
  publicId,
  alt,
  preset,
  className,
  sizes,
  priority = false,
  style,
}: PhotoImageProps) {
  const presetDefinition = getImagePresetDefinition(preset)
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
        style={{
          backgroundImage: `url(${local.placeholder})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          ...style,
        }}
      />
    )
  }

  const cloudName = getCloudName()

  if (!cloudName) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ aspectRatio: presetDefinition.aspectRatio ?? undefined, ...style }}
      />
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      src={buildCloudinaryImageUrl({ cloudName, publicId, preset })}
      srcSet={buildCloudinarySrcSet({ cloudName, publicId, preset })}
      sizes={sizes ?? presetDefinition.sizes}
      width={presetDefinition.width}
      height={presetDefinition.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      style={{
        backgroundImage: `url(${buildCloudinaryPlaceholder({ cloudName, publicId, preset })})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        aspectRatio: presetDefinition.aspectRatio ?? undefined,
        ...style,
      }}
    />
  )
}
