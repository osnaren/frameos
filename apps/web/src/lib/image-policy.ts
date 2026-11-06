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

export interface ContainedSizeRule {
  /** Media condition, e.g. `(max-width: 640px)`; omit for the final fallback rule. */
  media?: string
  /** CSS lengths the frame's width can't exceed. */
  maxWidths: readonly string[]
  /** CSS lengths the frame's height can't exceed (scaled by the aspect ratio into widths). */
  maxHeights: readonly string[]
}

function roundRatio(value: number) {
  return Math.round(value * 1000) / 1000
}

/**
 * `sizes` for a photograph shown whole inside a box capped by both width and
 * height (the detail stage, the lightbox). A portrait frame limited to 58vh
 * is only ~300px wide on a laptop, so a plain "76vw" would download a file
 * several times larger than it ever displays. Each rule resolves to the
 * smallest of its width caps and its height caps × aspect ratio.
 */
export function containedImageSizes(
  width: number,
  height: number,
  rules: readonly ContainedSizeRule[]
): string {
  const ratio = width > 0 && height > 0 ? roundRatio(width / height) : 1

  return rules
    .map((rule) => {
      const candidates = [
        ...rule.maxWidths,
        ...rule.maxHeights.map((length) => `calc(${length} * ${ratio})`),
      ]
      const value = candidates.length === 1 ? candidates[0] : `min(${candidates.join(', ')})`
      return rule.media ? `${rule.media} ${value}` : value
    })
    .join(', ')
}

/**
 * `sizes` for one tile of the Index's justified contact sheet. Tiles grow in
 * proportion to their aspect ratio, so a landscape frame can be three times
 * wider than a portrait one sitting in the same row.
 */
export function contactSheetTileSizes(width: number, height: number) {
  const ratio = width > 0 && height > 0 ? width / height : 1
  const mobileVw = Math.min(92, Math.max(30, Math.round(ratio * 52)))
  const desktopPx = Math.min(640, Math.max(150, Math.round(ratio * 280)))

  return `(max-width: 640px) ${mobileVw}vw, ${desktopPx}px`
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
