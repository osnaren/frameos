import * as THREE from 'three'

/**
 * Procedural canvas textures for the Pocket Worlds journey — soft glows,
 * cloud puffs, light shafts, water caustics and warm discs. Everything
 * abstract in the dioramas is atmosphere drawn in image-derived colours;
 * nothing here imitates a photographic subject.
 *
 * Each generator is memoised by callers and disposed on unmount.
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

function seeded(seed: number) {
  let s = seed || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** Soft radial glow, white — tint via material colour. */
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
  const random = seeded(seed)

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

  const mask = ctx.createLinearGradient(0, 0, width, 0)
  mask.addColorStop(0, 'rgba(0,0,0,1)')
  mask.addColorStop(0.3, 'rgba(0,0,0,0)')
  mask.addColorStop(0.7, 'rgba(0,0,0,0)')
  mask.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

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

/** A single round leaf with a bright rain droplet — Small Wonders motif. */
export function createDropletTexture(size = 128) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  const glass = ctx.createRadialGradient(cx - size * 0.12, cy - size * 0.14, 0, cx, cy, size * 0.46)
  glass.addColorStop(0, 'rgba(255,255,255,0.95)')
  glass.addColorStop(0.3, 'rgba(214,240,236,0.5)')
  glass.addColorStop(0.75, 'rgba(150,196,190,0.28)')
  glass.addColorStop(1, 'rgba(150,196,190,0)')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2)
  ctx.fill()
  /* specular highlight */
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(cx - size * 0.13, cy - size * 0.15, size * 0.08, 0, Math.PI * 2)
  ctx.fill()
  return toTexture(canvas)
}

/** A five-petal flower silhouette in a warm colour, for Small Wonders. */
export function createFlowerTexture(size = 128, petal = '#f4b53a', center = '#b5651d') {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = petal
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const px = cx + Math.cos(a) * size * 0.24
    const py = cy + Math.sin(a) * size * 0.24
    ctx.beginPath()
    ctx.ellipse(px, py, size * 0.17, size * 0.1, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = center
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.11, 0, Math.PI * 2)
  ctx.fill()
  return toTexture(canvas)
}

/** A round plated-food disc — clay rim, warm centre — for At the Table. */
export function createPlateTexture(size = 128, food = '#c67a3a') {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = '#efe7d6'
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = food
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2)
  ctx.fill()
  const sheen = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.1, 0, cx, cy, size * 0.46)
  sheen.addColorStop(0, 'rgba(255,255,255,0.35)')
  sheen.addColorStop(0.4, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2)
  ctx.fill()
  return toTexture(canvas)
}
