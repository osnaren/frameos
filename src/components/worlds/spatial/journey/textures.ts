import * as THREE from 'three'

/**
 * Small procedural textures drawn once on offscreen canvases: soft glows,
 * cloud puffs, light shafts, and the warm table disc. Everything abstract in
 * the journey is atmosphere in image-derived colors — never modeled objects.
 */

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 2
  return texture
}

/** Soft radial glow, white — tint via material color. */
export function createGlowTexture(size = 128) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.14)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return toTexture(canvas)
}

/** Irregular cloud puff: several offset radial gradients. */
export function createCloudTexture(size = 256, seed = 1) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  let s = seed

  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }

  for (let i = 0; i < 7; i++) {
    const x = size * (0.28 + random() * 0.44)
    const y = size * (0.34 + random() * 0.32)
    const r = size * (0.14 + random() * 0.2)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, 'rgba(255,255,255,0.32)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  return toTexture(canvas)
}

/** Vertical light shaft: bright at top, feathered sides and foot. */
export function createShaftTexture(width = 64, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const vertical = ctx.createLinearGradient(0, 0, 0, height)
  vertical.addColorStop(0, 'rgba(255,255,255,0.5)')
  vertical.addColorStop(0.7, 'rgba(255,255,255,0.12)')
  vertical.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = vertical
  ctx.fillRect(0, 0, width, height)

  /* feather the sides */
  const mask = ctx.createLinearGradient(0, 0, width, 0)
  mask.addColorStop(0, 'rgba(0,0,0,1)')
  mask.addColorStop(0.3, 'rgba(0,0,0,0)')
  mask.addColorStop(0.7, 'rgba(0,0,0,0)')
  mask.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  const texture = toTexture(canvas)
  return texture
}

/** Warm table disc: clay center feathering into banana-leaf green. */
export function createTableDiscTexture(size = 256) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(216,166,112,0.85)')
  gradient.addColorStop(0.45, 'rgba(196,148,96,0.5)')
  gradient.addColorStop(0.78, 'rgba(116,140,74,0.22)')
  gradient.addColorStop(1, 'rgba(116,140,74,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return toTexture(canvas)
}

/** Soft elliptical ground haze under a diorama. */
export function createHazeTexture(size = 256) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,0.42)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.14)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return toTexture(canvas)
}
