import { describe, expect, it } from 'vitest'

import {
  buildCaptureDetails,
  capturePalette,
  formatAspectRatio,
  formatCaptureDate,
  formatFileSize,
  formatMegapixels,
  hasCameraExif,
} from '@/lib/capture-details'

const fileOnly = {
  captureDate: undefined,
  locationLabel: undefined,
  metadata: {
    width: 2048,
    height: 1153,
    format: 'webp',
    bytes: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    palette: ['#cabca5', 'not-a-colour', '#7b7773'],
  },
}

describe('capture details', () => {
  it('formats dates straight from the string, without timezone drift', () => {
    expect(formatCaptureDate('2024-03-01')).toBe('1 March 2024')
    expect(formatCaptureDate('2024-03-01T00:30:00.000Z')).toBe('1 March 2024')
    expect(formatCaptureDate('2024-12-31', 'short')).toBe('Dec 2024')
    expect(formatCaptureDate('2024-07')).toBe('July 2024')
    expect(formatCaptureDate('yesterday')).toBeNull()
    expect(formatCaptureDate('2024-13-01')).toBeNull()
    expect(formatCaptureDate(undefined)).toBeNull()
  })

  it('names familiar aspect ratios in either orientation', () => {
    expect(formatAspectRatio(2048, 1153)).toBe('16:9')
    expect(formatAspectRatio(1103, 1958)).toBe('9:16')
    expect(formatAspectRatio(1469, 1958)).toBe('3:4')
    expect(formatAspectRatio(1956, 1958)).toBe('1:1')
    expect(formatAspectRatio(1000, 700)).toBe('1.43:1')
    expect(formatAspectRatio(0, 10)).toBeNull()
  })

  it('formats resolution and file size', () => {
    expect(formatMegapixels(2048, 1153)).toBe('2.4 MP')
    expect(formatMegapixels(4000, 3000)).toBe('12 MP')
    expect(formatFileSize(0)).toBeNull()
    expect(formatFileSize(845_000)).toBe('845 KB')
    expect(formatFileSize(3_400_000)).toBe('3.4 MB')
  })

  it('lists only the fields a photo actually has', () => {
    expect(buildCaptureDetails(fileOnly)).toEqual([
      { label: 'Dimensions', value: '2,048 × 1,153 px' },
      { label: 'Resolution', value: '2.4 MP' },
      { label: 'Aspect', value: '16:9' },
      { label: 'Format', value: 'WEBP' },
    ])
    expect(hasCameraExif(fileOnly)).toBe(false)
  })

  it('includes real EXIF, place, date and GPS when present', () => {
    const rows = buildCaptureDetails({
      captureDate: '2024-03-05',
      locationLabel: 'Kanyakumari',
      metadata: {
        ...fileOnly.metadata,
        camera: 'Pixel 7',
        aperture: 'ƒ/1.9',
        iso: '  ',
        gps: '8.07850, 77.54110',
        bytes: 2_100_000,
      },
    })

    expect(rows.map((row) => row.label)).toEqual([
      'Camera',
      'Aperture',
      'Captured',
      'Place',
      'GPS',
      'Dimensions',
      'Resolution',
      'Aspect',
      'Format',
      'File size',
    ])
  })

  it('keeps only well-formed palette colours', () => {
    expect(capturePalette(fileOnly)).toEqual(['#cabca5', '#7b7773'])
  })

  it('lists a colour once when several swatches share it', () => {
    const repeated = {
      ...fileOnly,
      metadata: { ...fileOnly.metadata, palette: ['#0588f2', '#0588F2', '#555250', '#0588f2'] },
    }
    expect(capturePalette(repeated)).toEqual(['#0588f2', '#555250'])
  })
})
