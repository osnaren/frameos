/**
 * The rows of a photograph's capture-data readout.
 *
 * Only fields that actually exist on the photo appear — real EXIF read at
 * upload/build time, editor-entered place/date, and the measured file —
 * never placeholders and never guesses. Formatting is deterministic (no
 * timezone conversion), so server and browser render identical text.
 */
import { isSafeColour } from '@/lib/image-placeholder'

import type { Photo } from '@/types/photo'

export interface CaptureDetail {
  label: string
  value: string
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * "2024-03-05", "2024-03-05T17:42:00Z" → "5 March 2024"; "2024-03" → "March
 * 2024". Read straight from the string so a date never shifts by a day when
 * the visitor's timezone differs from where it was recorded.
 */
export function formatCaptureDate(value: string | undefined, style: 'long' | 'short' = 'long') {
  const match = value?.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)

  if (!match) {
    return null
  }

  const [, year, monthText, dayText] = match
  const month = Number(monthText)

  if (month < 1 || month > 12) {
    return null
  }

  const monthName = style === 'short' ? MONTHS[month - 1].slice(0, 3) : MONTHS[month - 1]

  if (style === 'short' || !dayText) {
    return `${monthName} ${year}`
  }

  return `${Number(dayText)} ${monthName} ${year}`
}

const COMMON_RATIOS: Array<[number, number]> = [
  [1, 1],
  [4, 3],
  [3, 2],
  [16, 9],
  [5, 4],
  [21, 9],
]

/** "16:9", "3:4" — or "1.43:1" when the frame isn't a familiar shape. */
export function formatAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return null
  }

  const ratio = width / height

  for (const [long, short] of COMMON_RATIOS) {
    for (const [w, h] of [
      [long, short],
      [short, long],
    ]) {
      if (Math.abs(ratio - w / h) / (w / h) < 0.015) {
        return `${w}:${h}`
      }
    }
  }

  return ratio >= 1 ? `${ratio.toFixed(2)}:1` : `1:${(1 / ratio).toFixed(2)}`
}

export function formatMegapixels(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return null
  }

  const megapixels = (width * height) / 1_000_000
  return `${megapixels >= 10 ? Math.round(megapixels) : megapixels.toFixed(1)} MP`
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null
  }

  if (bytes < 1_000_000) {
    return `${Math.max(1, Math.round(bytes / 1000))} KB`
  }

  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function present(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Every capture-data row this photograph actually has, in reading order. */
export function buildCaptureDetails(
  photo: Pick<Photo, 'metadata' | 'captureDate' | 'locationLabel'>
) {
  const { metadata } = photo
  const hasSize = metadata.width > 0 && metadata.height > 0
  const rows: Array<[string, string | null | undefined]> = [
    ['Camera', metadata.camera],
    ['Lens', metadata.lens],
    ['Focal length', metadata.focalLength],
    ['Aperture', metadata.aperture],
    ['Shutter', metadata.shutterSpeed],
    ['ISO', metadata.iso],
    ['Captured', formatCaptureDate(photo.captureDate)],
    ['Place', photo.locationLabel],
    ['GPS', metadata.gps],
    [
      'Dimensions',
      hasSize
        ? `${metadata.width.toLocaleString('en')} × ${metadata.height.toLocaleString('en')} px`
        : null,
    ],
    ['Resolution', formatMegapixels(metadata.width, metadata.height)],
    ['Aspect', formatAspectRatio(metadata.width, metadata.height)],
    ['Format', present(metadata.format) ? metadata.format.toUpperCase() : null],
    ['File size', formatFileSize(metadata.bytes)],
  ]

  return rows
    .filter((row): row is [string, string] => present(row[1]))
    .map(([label, value]) => ({ label, value: value.trim() }) satisfies CaptureDetail)
}

/** True when any camera-side EXIF survived (as opposed to only file measurements). */
export function hasCameraExif(photo: Pick<Photo, 'metadata'>) {
  const { camera, lens, focalLength, aperture, shutterSpeed, iso } = photo.metadata
  return [camera, lens, focalLength, aperture, shutterSpeed, iso].some(present)
}

/**
 * The measured palette, limited to well-formed colours, each listed once.
 * Sanity's swatches (dominant, vibrant, muted…) often land on the same colour.
 */
export function capturePalette(photo: Pick<Photo, 'metadata'>) {
  const seen = new Set<string>()
  return (photo.metadata.palette ?? []).filter((colour) => {
    if (!isSafeColour(colour)) return false
    const key = colour.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface CaptureSection {
  title: string
  rows: CaptureDetail[]
}

const SECTION_OF: Record<string, string> = {
  Camera: 'Exposure',
  Lens: 'Exposure',
  'Focal length': 'Exposure',
  Aperture: 'Exposure',
  Shutter: 'Exposure',
  ISO: 'Exposure',
  Captured: 'When & where',
  Place: 'When & where',
  GPS: 'When & where',
}

/**
 * The same rows as buildCaptureDetails, grouped the way a photographer reads
 * them: how it was exposed, when and where, then the archived file. Empty
 * groups are dropped.
 */
export function buildCaptureSections(
  photo: Pick<Photo, 'metadata' | 'captureDate' | 'locationLabel'>
): CaptureSection[] {
  const order = ['Exposure', 'When & where', 'File']
  const groups = new Map<string, CaptureDetail[]>(order.map((title) => [title, []]))

  for (const detail of buildCaptureDetails(photo)) {
    groups.get(SECTION_OF[detail.label] ?? 'File')?.push(detail)
  }

  return order
    .map((title) => ({ title, rows: groups.get(title) ?? [] }))
    .filter((section) => section.rows.length > 0)
}

/**
 * One-line exposure readout in the order it's read off a camera back —
 * "26 mm · ƒ/1.8 · 1/120 s · ISO 100" — or null when no exposure values
 * survived. Values are shown as recorded, with only the conventional
 * prefix/suffix added when missing.
 */
export function exposureSummary(photo: Pick<Photo, 'metadata'>) {
  const { focalLength, aperture, shutterSpeed, iso } = photo.metadata
  const parts = [
    present(focalLength) ? focalLength.trim() : null,
    present(aperture) ? aperture.trim().replace(/^f\s*\/?\s*/i, 'ƒ/') : null,
    present(shutterSpeed)
      ? /s$/i.test(shutterSpeed.trim())
        ? shutterSpeed.trim()
        : `${shutterSpeed.trim()} s`
      : null,
    present(iso) ? (/^iso/i.test(iso.trim()) ? iso.trim() : `ISO ${iso.trim()}`) : null,
  ].filter((part): part is string => part !== null)

  return parts.length >= 2 ? parts.join(' · ') : null
}
