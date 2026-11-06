/**
 * What a photograph shows before its real file has arrived.
 *
 * Every photo carries a tiny base64 preview (Sanity's `lqip`, or the local
 * manifest's `placeholder`) and a measured palette. The preview is wrapped in
 * an SVG blur so it reads as a soft, out-of-focus version of the frame rather
 * than a blocky 24px thumbnail stretched to fit — and because the blur lives
 * inside the background image, the element's own edges stay crisp. Without a
 * preview, the palette paints a quiet gradient; without either, nothing.
 */
import type { CSSProperties } from 'react'

export interface PlaceholderSource {
  /** Tiny base64 data URI of the photograph. */
  preview?: string
  /** Measured colours, most dominant first. */
  palette?: readonly string[]
  /** Intrinsic dimensions, used only to keep the blur proportional. */
  width?: number
  height?: number
}

/** Blur radius in SVG user units, on a canvas normalised to 100 units wide. */
const BLUR_STD_DEVIATION = 5
const SVG_CANVAS_WIDTH = 100

/** Only base64 data URIs are embedded; anything else could break out of the SVG markup. */
const DATA_URI_PATTERN = /^data:image\/(?:webp|jpeg|jpg|png|gif|avif);base64,[a-z0-9+/=]+$/i
const COLOUR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function isSafePreview(value: string | undefined): value is string {
  return typeof value === 'string' && DATA_URI_PATTERN.test(value)
}

export function isSafeColour(value: string | undefined): value is string {
  return typeof value === 'string' && COLOUR_PATTERN.test(value)
}

/**
 * A CSS `url(...)` value: the preview, Gaussian-blurred inside an SVG. The
 * alpha channel is clamped back to opaque after the blur so the edges don't
 * fade to transparent (the usual tell of a CSS-blurred placeholder).
 */
export function buildBlurredPreview(preview: string, width?: number, height?: number) {
  const ratio = width && height && width > 0 && height > 0 ? height / width : 1
  const canvasHeight = Math.max(1, Math.round(SVG_CANVAS_WIDTH * ratio))
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${SVG_CANVAS_WIDTH} ${canvasHeight}' preserveAspectRatio='none'>` +
    `<filter id='b' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
    `<feGaussianBlur stdDeviation='${BLUR_STD_DEVIATION}'/>` +
    `<feComponentTransfer><feFuncA type='discrete' tableValues='1 1'/></feComponentTransfer>` +
    `</filter>` +
    `<image filter='url(#b)' x='0' y='0' width='100%' height='100%' preserveAspectRatio='none' href='${preview}'/>` +
    `</svg>`

  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`
}

/** Inline style that paints the placeholder behind (and until replaced by) the real image. */
export function buildPlaceholderStyle(source: PlaceholderSource): CSSProperties {
  const palette = (source.palette ?? []).filter(isSafeColour)
  const style: CSSProperties = {}

  if (palette[0]) {
    style.backgroundColor = palette[0]
  }

  if (isSafePreview(source.preview)) {
    style.backgroundImage = buildBlurredPreview(source.preview, source.width, source.height)
  } else if (palette.length >= 2) {
    style.backgroundImage = `linear-gradient(160deg, ${palette[0]}, ${palette[1]} 55%, ${palette.at(-1)})`
  }

  if (style.backgroundImage) {
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
    style.backgroundRepeat = 'no-repeat'
  }

  return style
}
