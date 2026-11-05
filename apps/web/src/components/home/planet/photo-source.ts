import { buildSanityImageUrl } from '@/lib/image-policy'
import { getLocalPhotoAsset, getLocalVariantUrl } from '@/lib/local-photos'

import type { Photo } from '@/types/photo'
import type { CSSProperties } from 'react'

/** A texture-sized URL for a photograph: bundled variants locally, Sanity's CDN otherwise. */
export function photoTextureUrl(photo: Photo, width: number) {
  return (
    getLocalVariantUrl(photo.publicId, width) ??
    buildSanityImageUrl({ baseUrl: photo.publicId, preset: 'detail', width })
  )
}

/** The photo's blurred placeholder (local manifest or Sanity LQIP), if any. */
export function photoPlaceholder(photo: Photo) {
  return getLocalPhotoAsset(photo.publicId)?.placeholder ?? photo.image?.lqip
}

/** A soft palette disc that stands in for the planet until it has been painted. */
export function planetPlaceholderStyle(photo: Photo): CSSProperties {
  const palette = photo.metadata.palette ?? []
  const core = palette.at(1) ?? palette.at(0) ?? '#b9b2a4'
  const rim = palette.at(3) ?? palette.at(2) ?? palette.at(0) ?? '#d9d3c7'
  return {
    background: `radial-gradient(circle at 50% 50%, ${core} 0%, ${core} 22%, ${rim} 70%)`,
  }
}
