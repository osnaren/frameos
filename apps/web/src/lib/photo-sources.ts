/**
 * The `src`/`srcset` a photograph is delivered from — shared by PhotoImage
 * and by neighbour preloading, so a preload warms exactly the file the next
 * view will request.
 */
import {
  buildSanityImageUrl,
  buildSanitySrcSet,
  type ImagePreset,
  type SanityImageHotspot,
} from '@/lib/image-policy'
import { getLocalPhotoAsset } from '@/lib/local-photos'

export interface PhotoSources {
  src: string
  srcSet: string
}

export function resolvePhotoSources(options: {
  publicId: string
  preset: ImagePreset
  hotspot?: SanityImageHotspot
}): PhotoSources | null {
  const local = getLocalPhotoAsset(options.publicId)

  if (local) {
    return { src: local.src, srcSet: local.srcSet }
  }

  if (!options.publicId) {
    return null
  }

  return {
    src: buildSanityImageUrl({
      baseUrl: options.publicId,
      preset: options.preset,
      hotspot: options.hotspot,
    }),
    srcSet: buildSanitySrcSet({
      baseUrl: options.publicId,
      preset: options.preset,
      hotspot: options.hotspot,
    }),
  }
}

const warmed = new Set<string>()

/**
 * Asks the browser to fetch the candidate it would pick for `sizes`, at idle
 * priority, so paging to a neighbour shows a sharp photo immediately. Safe to
 * call repeatedly; each source/size pair is only requested once per session.
 */
export function preloadPhoto(sources: PhotoSources | null, sizes: string) {
  if (!sources || typeof window === 'undefined') {
    return
  }

  const key = `${sources.src}|${sizes}`
  if (warmed.has(key)) {
    return
  }
  warmed.add(key)

  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.sizes = sizes
  image.srcset = sources.srcSet
  image.src = sources.src
}
