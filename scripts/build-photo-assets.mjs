/**
 * Pocket Worlds photo asset pipeline.
 *
 * Reads source originals from photo-source/ (never served, never committed),
 * emits responsive WebP variants to public/photos/<id>/w<width>.webp and a
 * generated manifest at src/content/photo-manifest.json containing dimensions,
 * a tiny inline blur placeholder, a measured color palette, and any real
 * camera/lens/exposure/GPS/capture-date EXIF found in the source file.
 *
 * Photos marked `hidden: true` get NO public variants, NO placeholder, and NO
 * capture data — only dimensions land in the manifest, so unpublished
 * portraits cannot be fetched from any deploy. Flip `hidden` and re-run to
 * publish later.
 *
 * Usage: node scripts/build-photo-assets.mjs
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import exifr from 'exifr'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'photo-source')
const OUTPUT_DIR = path.join(ROOT, 'public', 'photos')
const MANIFEST_PATH = path.join(ROOT, 'src', 'content', 'photo-manifest.json')

const VARIANT_WIDTHS = [320, 480, 768, 1024, 1440]
const PLACEHOLDER_WIDTH = 24

/** Source file → curated photo id. `hidden` photos produce no public assets. */
const SOURCES = [
  { file: 'image.png', id: 'small-plate' },
  { file: 'image (1).png', id: 'heart-frame', hidden: true },
  { file: 'image (2).png', id: 'paneer-skewers' },
  { file: 'image (3).png', id: 'tomatoes-on-the-vine' },
  { file: 'image (4).png', id: 'before-the-mandala', hidden: true },
  { file: 'image (5).png', id: 'the-waterfall' },
  { file: 'image (6).png', id: 'leaf-after-rain' },
  { file: 'image (7).png', id: 'rain-on-the-street' },
  { file: 'image (8).png', id: 'white-tower' },
  { file: 'image (9).png', id: 'tower-and-sky' },
  { file: 'image (10).png', id: 'the-sea' },
  { file: 'image (11).png', id: 'banana-leaf-meal' },
  { file: 'image (12).png', id: 'passing-overhead' },
  { file: 'image (13).png', id: 'yellow-flowers' },
  { file: 'image (14).png', id: 'the-chariot' },
  { file: 'image (15).png', id: 'toasted' },
  { file: 'image (16).png', id: 'cosmos' },
  { file: 'image (17).png', id: 'parakeet' },
  { file: 'image (18).png', id: 'the-cat' },
  { file: 'image (19).png', id: 'grazing' },
]

function toHex(r, g, b) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** "Apple", "iPhone 13 Pro" → "iPhone 13 Pro" (skip redundant brand prefix); otherwise join both. */
function formatCamera(make, model) {
  const trimmedMake = typeof make === 'string' ? make.trim() : ''
  const trimmedModel = typeof model === 'string' ? model.trim() : ''

  if (!trimmedModel) {
    return trimmedMake || undefined
  }

  if (!trimmedMake || trimmedModel.toLowerCase().includes(trimmedMake.toLowerCase())) {
    return trimmedModel
  }

  return `${trimmedMake} ${trimmedModel}`
}

function formatFocalLength(focalLength) {
  return typeof focalLength === 'number' && Number.isFinite(focalLength)
    ? `${Math.round(focalLength)}mm`
    : undefined
}

function formatIso(iso) {
  return typeof iso === 'number' && Number.isFinite(iso) ? String(iso) : undefined
}

/** 1/200s for fast exposures, whole seconds for long exposures. */
function formatShutterSpeed(exposureTime) {
  if (typeof exposureTime !== 'number' || !Number.isFinite(exposureTime) || exposureTime <= 0) {
    return undefined
  }

  if (exposureTime >= 1) {
    return `${Math.round(exposureTime * 10) / 10}s`
  }

  return `1/${Math.round(1 / exposureTime)}s`
}

function formatAperture(fNumber) {
  if (typeof fNumber !== 'number' || !Number.isFinite(fNumber)) {
    return undefined
  }

  return `f/${Math.round(fNumber * 10) / 10}`
}

function formatGps(latitude, longitude) {
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    : undefined
}

function formatCaptureDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : undefined
}

/**
 * Best-effort real EXIF read (camera, lens, exposure, GPS, capture date).
 * Returns only the fields actually present in the file — never invented,
 * matching the editorial rule in src/content/worlds.ts. Screenshots/exports
 * with no EXIF (e.g. plain PNGs) simply yield an empty object.
 */
async function extractCaptureInfo(buffer) {
  let tags

  try {
    tags = await exifr.parse(buffer)
  } catch {
    return {}
  }

  if (!tags) {
    return {}
  }

  const info = {}
  const camera = formatCamera(tags.Make, tags.Model)
  const lens = typeof tags.LensModel === 'string' ? tags.LensModel.trim() : undefined
  const focalLength = formatFocalLength(tags.FocalLength)
  const iso = formatIso(tags.ISO)
  const shutterSpeed = formatShutterSpeed(tags.ExposureTime)
  const aperture = formatAperture(tags.FNumber)
  const gps = formatGps(tags.latitude, tags.longitude)
  const captureDate = formatCaptureDate(tags.DateTimeOriginal ?? tags.CreateDate)

  if (camera) info.camera = camera
  if (lens) info.lens = lens
  if (focalLength) info.focalLength = focalLength
  if (iso) info.iso = iso
  if (shutterSpeed) info.shutterSpeed = shutterSpeed
  if (aperture) info.aperture = aperture
  if (gps) info.gps = gps
  if (captureDate) info.captureDate = captureDate

  return info
}

/** Coarse quantization palette: top swatches from a 64px sample, most-frequent first. */
async function extractPalette(image) {
  const sample = await image
    .clone()
    .resize(64, 64, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { data, info } = sample
  const buckets = new Map()

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = `${r >> 4}:${g >> 4}:${b >> 4}`
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 }
    bucket.r += r
    bucket.g += g
    bucket.b += b
    bucket.count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((bucket) =>
      toHex(
        Math.round(bucket.r / bucket.count),
        Math.round(bucket.g / bucket.count),
        Math.round(bucket.b / bucket.count)
      )
    )
}

async function processPhoto(source) {
  const inputPath = path.join(SOURCE_DIR, source.file)
  const sourceBuffer = await readFile(inputPath)
  const original = sharp(sourceBuffer)
  const meta = await original.metadata()
  const entry = {
    id: source.id,
    width: meta.width,
    height: meta.height,
    hidden: Boolean(source.hidden),
    widths: [],
    placeholder: '',
    palette: [],
  }

  if (source.hidden) {
    return entry
  }

  Object.assign(entry, await extractCaptureInfo(sourceBuffer))
  entry.palette = await extractPalette(original)

  const placeholder = await original
    .clone()
    .resize(PLACEHOLDER_WIDTH, null, { fit: 'inside' })
    .blur(1.2)
    .webp({ quality: 32 })
    .toBuffer()
  entry.placeholder = `data:image/webp;base64,${placeholder.toString('base64')}`

  const photoDir = path.join(OUTPUT_DIR, source.id)
  await mkdir(photoDir, { recursive: true })

  const widths = VARIANT_WIDTHS.filter((w) => w < meta.width)
  widths.push(Math.min(meta.width, 2048))
  entry.widths = widths

  await Promise.all(
    widths.map(async (width) => {
      const buffer = await original
        .clone()
        .resize(width, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
      await writeFile(path.join(photoDir, `w${width}.webp`), buffer)
    })
  )

  return entry
}

async function main() {
  await rm(OUTPUT_DIR, { recursive: true, force: true })
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })

  const entries = []
  for (const source of SOURCES) {
    const entry = await processPhoto(source)
    entries.push(entry)
    const captureNote = entry.camera ? `, EXIF: ${entry.camera}` : ''
    console.log(
      `${entry.id}: ${entry.width}x${entry.height}${entry.hidden ? ' (hidden, no public assets)' : ` → ${entry.widths.length} variants${captureNote}`}`
    )
  }

  const manifest = {
    generatedBy: 'scripts/build-photo-assets.mjs',
    photos: Object.fromEntries(entries.map(({ id, ...rest }) => [id, rest])),
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`\nManifest written to ${path.relative(ROOT, MANIFEST_PATH)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
