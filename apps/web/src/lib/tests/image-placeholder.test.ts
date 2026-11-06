import { describe, expect, it } from 'vitest'

import {
  buildBlurredPreview,
  buildPlaceholderStyle,
  isSafeColour,
  isSafePreview,
} from '@/lib/image-placeholder'

const PREVIEW = 'data:image/webp;base64,UklGRqAAAABXRUJQVlA4IJQAAAA='

describe('image placeholders', () => {
  it('only embeds base64 image data URIs', () => {
    expect(isSafePreview(PREVIEW)).toBe(true)
    expect(isSafePreview("data:image/webp;base64,abc'/><script>")).toBe(false)
    expect(isSafePreview('https://cdn.example.com/x.jpg')).toBe(false)
    expect(isSafePreview(undefined)).toBe(false)
  })

  it('accepts hex colours and rejects anything that could inject CSS', () => {
    expect(isSafeColour('#16303c')).toBe(true)
    expect(isSafeColour('#fff')).toBe(true)
    expect(isSafeColour('red; background: url(x)')).toBe(false)
  })

  it('wraps the preview in a proportional SVG blur with opaque edges', () => {
    const value = buildBlurredPreview(PREVIEW, 2048, 1153)
    const svg = decodeURIComponent(value.slice('url("data:image/svg+xml;charset=utf-8,'.length, -2))

    expect(value.startsWith('url("data:image/svg+xml')).toBe(true)
    expect(svg).toContain("viewBox='0 0 100 56'")
    expect(svg).toContain('feGaussianBlur')
    expect(svg).toContain("feFuncA type='discrete'")
    expect(svg).toContain(PREVIEW)
  })

  it('paints the blurred preview over the dominant colour', () => {
    const style = buildPlaceholderStyle({
      preview: PREVIEW,
      palette: ['#161615', '#77776c'],
      width: 1103,
      height: 1958,
    })

    expect(style.backgroundColor).toBe('#161615')
    expect(String(style.backgroundImage)).toContain('data:image/svg+xml')
    expect(style.backgroundSize).toBe('cover')
  })

  it('falls back to a palette gradient, then to nothing', () => {
    const gradient = buildPlaceholderStyle({ palette: ['#cabca5', '#c6b79a', '#7b7773'] })
    expect(gradient.backgroundImage).toBe('linear-gradient(160deg, #cabca5, #c6b79a 55%, #7b7773)')

    expect(buildPlaceholderStyle({})).toEqual({})
  })
})
