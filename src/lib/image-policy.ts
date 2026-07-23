const DEFAULT_TRANSFORMS = ['f_auto', 'q_auto', 'dpr_auto']

export const responsiveBreakpoints = [320, 480, 640, 768, 1024, 1280, 1536, 1920] as const

export type ImagePreset = 'thumb' | 'card' | 'gallery' | 'hero' | 'detail' | 'spatial' | 'og'

export interface ImagePresetDefinition {
  width: number
  height?: number
  sizes: string
  aspectRatio?: string
  crop: string
}

export const imagePresetMap: Record<ImagePreset, ImagePresetDefinition> = {
  thumb: {
    width: 320,
    height: 320,
    sizes: '(max-width: 640px) 40vw, 160px',
    aspectRatio: '1 / 1',
    crop: 'c_fill,g_auto',
  },
  card: {
    width: 640,
    height: 800,
    sizes: '(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 30vw',
    aspectRatio: '4 / 5',
    crop: 'c_fill,g_auto',
  },
  gallery: {
    width: 960,
    sizes: '(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px',
    crop: 'c_limit',
  },
  hero: {
    width: 1920,
    height: 1200,
    sizes: '100vw',
    aspectRatio: '16 / 10',
    crop: 'c_fill,g_auto',
  },
  detail: {
    width: 1600,
    sizes: '(max-width: 1024px) 100vw, 70vw',
    crop: 'c_limit',
  },
  spatial: {
    width: 768,
    sizes: '768px',
    crop: 'c_limit',
  },
  og: {
    width: 1200,
    height: 630,
    sizes: '1200px',
    aspectRatio: '1200 / 630',
    crop: 'c_fill,g_auto',
  },
}

export function getImagePresetDefinition(preset: ImagePreset) {
  return imagePresetMap[preset]
}

function encodePublicId(publicId: string) {
  return publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function buildCloudinaryImageUrl(options: {
  cloudName: string
  publicId: string
  preset: ImagePreset
  width?: number
  blur?: boolean
}) {
  const preset = imagePresetMap[options.preset]
  const width = options.width ?? preset.width
  const transforms = [
    ...DEFAULT_TRANSFORMS,
    preset.crop,
    `w_${width}`,
    preset.height ? `h_${preset.height}` : null,
    options.blur ? 'e_blur:1200,q_20,w_48' : null,
  ].filter(Boolean)

  return `https://res.cloudinary.com/${options.cloudName}/image/upload/${transforms.join(',')}/${encodePublicId(options.publicId)}`
}

export function buildCloudinarySrcSet(options: {
  cloudName: string
  publicId: string
  preset: ImagePreset
}) {
  const preset = imagePresetMap[options.preset]

  return responsiveBreakpoints
    .filter((width) => width <= preset.width)
    .map(
      (width) =>
        `${buildCloudinaryImageUrl({
          cloudName: options.cloudName,
          publicId: options.publicId,
          preset: options.preset,
          width,
        })} ${width}w`
    )
    .join(', ')
}

export function buildCloudinaryPlaceholder(options: {
  cloudName: string
  publicId: string
  preset: ImagePreset
}) {
  return buildCloudinaryImageUrl({
    cloudName: options.cloudName,
    publicId: options.publicId,
    preset: options.preset,
    blur: true,
  })
}
