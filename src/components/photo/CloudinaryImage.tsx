import {
  buildCloudinaryImageUrl,
  buildCloudinaryPlaceholder,
  buildCloudinarySrcSet,
  getImagePresetDefinition,
} from '@/lib/image-policy'
import type { ImagePreset } from '@/lib/image-policy'

function getCloudName() {
  return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || (import.meta.env.DEV ? 'demo' : '')
}

export function CloudinaryImage({
  publicId,
  alt,
  preset,
  className,
  sizes,
  priority = false,
}: {
  publicId: string
  alt: string
  preset: ImagePreset
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const cloudName = getCloudName()
  const presetDefinition = getImagePresetDefinition(preset)

  if (!cloudName) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ aspectRatio: presetDefinition.aspectRatio ?? undefined }}
      />
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      src={buildCloudinaryImageUrl({
        cloudName,
        publicId,
        preset,
      })}
      srcSet={buildCloudinarySrcSet({
        cloudName,
        publicId,
        preset,
      })}
      sizes={sizes ?? presetDefinition.sizes}
      width={presetDefinition.width}
      height={presetDefinition.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      style={{
        backgroundImage: `url(${buildCloudinaryPlaceholder({
          cloudName,
          publicId,
          preset,
        })})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        aspectRatio: presetDefinition.aspectRatio ?? undefined,
      }}
    />
  )
}
