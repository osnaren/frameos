export const responsiveBreakpoints = [320, 480, 640, 768, 1024, 1280, 1536, 1920] as const

export type ImagePreset = 'thumb' | 'card' | 'gallery' | 'hero' | 'detail' | 'spatial' | 'og'

export interface ImagePresetDefinition {
  width: number
  height?: number
  sizes: string
  aspectRatio?: string
  /** 'crop' respects the editor-set hotspot; 'max' preserves aspect ratio without cropping. */
  fit: 'crop' | 'max'
}

export const imagePresetMap: Record<ImagePreset, ImagePresetDefinition> = {
  thumb: {
    width: 320,
    height: 320,
    sizes: '(max-width: 640px) 40vw, 160px',
    aspectRatio: '1 / 1',
    fit: 'crop',
  },
  card: {
    width: 640,
    height: 800,
    sizes: '(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw',
    aspectRatio: '4 / 5',
    fit: 'crop',
  },
  gallery: {
    width: 960,
    sizes: '(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px',
    fit: 'max',
  },
  hero: {
    width: 1920,
    height: 1200,
    sizes: '100vw',
    aspectRatio: '16 / 10',
    fit: 'crop',
  },
  detail: {
    width: 1600,
    sizes: '(max-width: 1024px) 100vw, 70vw',
    fit: 'max',
  },
  spatial: {
    width: 768,
    sizes: '768px',
    fit: 'max',
  },
  og: {
    width: 1200,
    height: 630,
    sizes: '1200px',
    aspectRatio: '1200 / 630',
    fit: 'crop',
  },
}

export function getImagePresetDefinition(preset: ImagePreset) {
  return imagePresetMap[preset]
}

export interface SanityImageHotspot {
  x: number
  y: number
}

/**
 * Builds a delivery URL against Sanity's asset CDN (`baseUrl` is the ready
 * `asset->url` returned by the provider) using its URL-param image pipeline:
 * https://www.sanity.io/docs/apis-and-sdks/asset-cdn
 */
export function buildSanityImageUrl(options: {
  baseUrl: string
  preset: ImagePreset
  width?: number
  hotspot?: SanityImageHotspot
}) {
  const preset = imagePresetMap[options.preset]
  const width = options.width ?? preset.width
  const params = new URLSearchParams({ w: String(width), auto: 'format', q: '75' })

  if (preset.height) {
    params.set('h', String(Math.round((preset.height / preset.width) * width)))
  }

  if (preset.fit === 'crop') {
    params.set('fit', 'crop')
    params.set('crop', 'focalpoint')
    params.set('fp-x', String(options.hotspot?.x ?? 0.5))
    params.set('fp-y', String(options.hotspot?.y ?? 0.5))
  } else {
    params.set('fit', 'max')
  }

  return `${options.baseUrl}?${params.toString()}`
}

export function buildSanitySrcSet(options: {
  baseUrl: string
  preset: ImagePreset
  hotspot?: SanityImageHotspot
}) {
  const preset = imagePresetMap[options.preset]

  return responsiveBreakpoints
    .filter((width) => width <= preset.width)
    .map((width) => `${buildSanityImageUrl({ ...options, width })} ${width}w`)
    .join(', ')
}
