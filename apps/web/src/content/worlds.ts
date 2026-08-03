/**
 * Pocket Worlds — curated launch content.
 *
 * This module is the editorial source for the launch archive: world
 * definitions (name, statement, mood, motion signature) and per-photo
 * editorial data (title, alt, caption, ordering). Physical image data
 * (dimensions, palettes, placeholders, variant widths, and any real
 * camera/lens/exposure/GPS/capture-date EXIF found in the source file)
 * comes from the generated photo-manifest.json; run
 * `node scripts/build-photo-assets.mjs` after changing source photos.
 *
 * Titles and captions are creative naming of what is visible in each
 * photograph. Locations, dates, and equipment are intentionally absent
 * unless supplied — nothing here is invented.
 */
import manifest from './photo-manifest.json'

import type { Photo } from '@/types/photo'

export type WorldSlug =
  'wander' | 'sacred-geometry' | 'small-wonders' | 'living-things' | 'at-the-table' | 'people'

/**
 * Each world's motion signature, used by the world scene engine:
 * - drift: broad horizontal travel, open horizons (Wander)
 * - rise: vertical stacking, monumental symmetry (Sacred Geometry)
 * - macro: focus pulls and scale shifts (Small Wonders)
 * - quiet: slow breathing reveals, stillness (Living Things)
 * - gather: warm radial arrangement (At the Table)
 */
export type MotionSignature = 'drift' | 'rise' | 'macro' | 'quiet' | 'gather'

export interface WorldMood {
  /** Pale ambient wash behind the scene */
  wash: string
  /** Deep tone for immersive/dark passages */
  deep: string
  /** Accent for labels, rules, focus marks */
  accent: string
}

export interface WorldDefinition {
  slug: WorldSlug
  name: string
  /** One-line world statement, set in the display serif */
  line: string
  signature: MotionSignature
  mood: WorldMood
  heroId: string
  /** Hidden worlds never appear in public navigation */
  hidden?: boolean
}

export const worlds: WorldDefinition[] = [
  {
    slug: 'wander',
    name: 'Wander',
    line: 'Places passed through, horizons kept.',
    signature: 'drift',
    mood: { wash: '#e3edf1', deep: '#16303c', accent: '#3e7284' },
    heroId: 'the-sea',
  },
  {
    slug: 'sacred-geometry',
    name: 'Sacred Geometry',
    line: 'Stone, sky, ritual, and repetition.',
    signature: 'rise',
    mood: { wash: '#e4ebf4', deep: '#0e2334', accent: '#2c5c9c' },
    heroId: 'tower-and-sky',
  },
  {
    slug: 'small-wonders',
    name: 'Small Wonders',
    line: 'The closer you look, the larger it gets.',
    signature: 'macro',
    mood: { wash: '#ecf1e2', deep: '#1d2f16', accent: '#4d7a38' },
    heroId: 'leaf-after-rain',
  },
  {
    slug: 'living-things',
    name: 'Living Things',
    line: 'Company that chooses its own distance.',
    signature: 'quiet',
    mood: { wash: '#e7eee7', deep: '#122019', accent: '#2f5d43' },
    heroId: 'parakeet',
  },
  {
    slug: 'at-the-table',
    name: 'Table Notes',
    line: 'Meals worth interrupting.',
    signature: 'gather',
    mood: { wash: '#f4ead9', deep: '#33210f', accent: '#b05c2a' },
    heroId: 'banana-leaf-meal',
  },
  {
    slug: 'people',
    name: 'People',
    line: 'Kept close, shown with permission.',
    signature: 'quiet',
    mood: { wash: '#f0e6e2', deep: '#2c1a16', accent: '#a05548' },
    heroId: 'heart-frame',
    hidden: true,
  },
]

interface EditorialEntry {
  id: string
  world: WorldSlug
  title: string
  alt: string
  caption?: string
  sortOrder: number
  tags: string[]
  /** Hidden photos stay `draft` — the repository's fail-closed guards keep them out of every public surface. */
  hidden?: boolean
}

const editorial: EditorialEntry[] = [
  // Wander
  {
    id: 'the-sea',
    world: 'wander',
    title: 'Where the Sea Keeps Going',
    alt: 'Waves breaking under a pale sky, the horizon stretching unbroken across the frame.',
    caption: 'The horizon does most of the work. You just have to stand still.',
    sortOrder: 96,
    tags: ['sea', 'horizon', 'hero'],
  },
  {
    id: 'the-waterfall',
    world: 'wander',
    title: 'The Waterfall',
    alt: 'A white waterfall dropping down a forested rock face under a clear sky.',
    caption: 'Heard long before it was seen.',
    sortOrder: 94,
    tags: ['hills', 'water'],
  },
  {
    id: 'passing-overhead',
    world: 'wander',
    title: 'Passing Overhead',
    alt: 'An airliner crossing an empty blue sky, seen from below.',
    caption: 'Everyone aboard is going somewhere. From here, it is a slow line across the blue.',
    sortOrder: 92,
    tags: ['sky', 'aircraft'],
  },
  // Sacred Geometry
  {
    id: 'tower-and-sky',
    world: 'sacred-geometry',
    title: 'Tower Against a Restless Sky',
    alt: 'A carved temple gopuram rising over rooftops beneath a dramatic streaked sky.',
    caption: 'The sky kept moving. The tower did not.',
    sortOrder: 86,
    tags: ['temple', 'sky', 'hero'],
  },
  {
    id: 'white-tower',
    world: 'sacred-geometry',
    title: 'The White Tower',
    alt: 'A whitewashed temple tower stacked tier upon tier against a saturated blue sky.',
    caption: 'Every tier holds a hundred figures, and every figure holds still.',
    sortOrder: 84,
    tags: ['temple', 'architecture'],
  },
  {
    id: 'the-chariot',
    world: 'sacred-geometry',
    title: 'The Chariot Moves',
    alt: 'A tall decorated festival chariot surrounded by a dense crowd on a temple street.',
    caption: 'For one afternoon, the street belongs to something taller than the buildings.',
    sortOrder: 82,
    tags: ['festival', 'crowd'],
  },
  // Small Wonders
  {
    id: 'leaf-after-rain',
    world: 'small-wonders',
    title: 'Leaf, After Rain',
    alt: 'A small heart-shaped leaf on a green stem, covered in round water droplets.',
    caption: 'The rain had just stopped. The leaf kept what it could.',
    sortOrder: 76,
    tags: ['rain', 'macro', 'hero'],
  },
  {
    id: 'rain-on-the-street',
    world: 'small-wonders',
    title: 'Rain, Falling Hard',
    alt: 'Rainwater splashing off a dark street, buildings dissolving into grey behind it.',
    caption: 'The whole street turned to sound.',
    sortOrder: 74,
    tags: ['rain', 'street'],
  },
  {
    id: 'yellow-flowers',
    world: 'small-wonders',
    title: 'Yellow Flowers',
    alt: 'Slender yellow flowers rising through green grass toward soft light.',
    caption: 'They were not planted. They arrived.',
    sortOrder: 72,
    tags: ['flowers'],
  },
  {
    id: 'cosmos',
    world: 'small-wonders',
    title: 'Cosmos in the Lane',
    alt: 'A single orange cosmos flower in sharp focus against a shaded garden path.',
    caption: 'One bright thing is enough.',
    sortOrder: 70,
    tags: ['flowers'],
  },
  {
    id: 'tomatoes-on-the-vine',
    world: 'small-wonders',
    title: 'Tomatoes, Evening Light',
    alt: 'Two ripe tomatoes hanging from a dry vine against a warm sunlit wall.',
    caption: 'The wall was doing its best impression of a studio.',
    sortOrder: 68,
    tags: ['produce', 'light'],
  },
  // Living Things
  {
    id: 'parakeet',
    world: 'living-things',
    title: 'Parakeet in the Dark Canopy',
    alt: 'A green rose-ringed parakeet perched in dense, dark foliage, lit by broken light.',
    caption: 'It let me watch for exactly as long as it wanted to.',
    sortOrder: 62,
    tags: ['bird', 'foliage', 'hero'],
  },
  {
    id: 'the-cat',
    world: 'living-things',
    title: 'A Cat, Content',
    alt: 'A tabby cat with eyes closed, leaning into a hand scratching its head.',
    caption: 'Trust, measured in half-closed eyes.',
    sortOrder: 60,
    tags: ['cat'],
  },
  {
    id: 'grazing',
    world: 'living-things',
    title: 'Grazing Below the Hills',
    alt: 'A cow grazing on rocky ground with palm trees and dry hills behind.',
    caption: 'Nobody here is in a hurry.',
    sortOrder: 58,
    tags: ['cattle', 'hills'],
  },
  // At the Table
  {
    id: 'banana-leaf-meal',
    world: 'at-the-table',
    title: 'On a Banana Leaf',
    alt: 'A full meal arranged on a banana leaf: rice, breads, and small servings in a circle.',
    caption: 'A whole geography, served on one leaf.',
    sortOrder: 52,
    tags: ['meal', 'hero'],
  },
  {
    id: 'paneer-skewers',
    world: 'at-the-table',
    title: 'Skewers, Charred',
    alt: 'Grilled paneer and pepper skewers lined up on a long plate.',
    caption: 'Char is a kind of seasoning.',
    sortOrder: 50,
    tags: ['grill'],
  },
  {
    id: 'toasted',
    world: 'at-the-table',
    title: 'Toasted, Halved',
    alt: 'Grilled sandwich halves stacked on white plates beside a bowl of curry.',
    caption: 'Cut diagonally. It matters.',
    sortOrder: 48,
    tags: ['snack'],
  },
  {
    id: 'small-plate',
    world: 'at-the-table',
    title: 'A Small Plate',
    alt: 'A bite-sized stuffed pastry topped with a chopped savoury filling, photographed close.',
    caption: 'Two bites, maybe three.',
    sortOrder: 46,
    tags: ['snack'],
  },
  // People — unpublished until permission is confirmed
  {
    id: 'heart-frame',
    world: 'people',
    title: 'Within the Heart',
    alt: 'A couple seated inside a large heart-shaped frame overlooking hills and water.',
    sortOrder: 30,
    tags: ['portrait'],
    hidden: true,
  },
  {
    id: 'before-the-mandala',
    world: 'people',
    title: 'Before the Mandala',
    alt: 'A woman in a pink and green saree standing before a circular patterned backdrop.',
    sortOrder: 28,
    tags: ['portrait'],
    hidden: true,
  },
]

export interface ManifestEntry {
  width: number
  height: number
  hidden: boolean
  widths: number[]
  placeholder: string
  palette: string[]
  /** Real EXIF, extracted by scripts/build-photo-assets.mjs — absent when the source has none. */
  camera?: string
  lens?: string
  focalLength?: string
  iso?: string
  shutterSpeed?: string
  aperture?: string
  gps?: string
  captureDate?: string
}

const manifestPhotos = manifest.photos as Record<string, ManifestEntry>

export function getManifestEntry(id: string): ManifestEntry | null {
  return manifestPhotos[id] ?? null
}

export const LOCAL_PUBLIC_ID_PREFIX = 'local/'

export function localPhotoId(publicId: string) {
  return publicId.startsWith(LOCAL_PUBLIC_ID_PREFIX)
    ? publicId.slice(LOCAL_PUBLIC_ID_PREFIX.length)
    : null
}

/** A generation timestamp for cursor ordering only — never shown as a capture date. */
const ARCHIVE_CREATED_AT = '2026-01-01T00:00:00.000Z'

export const curatedPhotos: Photo[] = editorial.map((entry) => {
  const asset = manifestPhotos[entry.id] as ManifestEntry | undefined

  if (!asset) {
    throw new Error(
      `Photo "${entry.id}" is missing from photo-manifest.json — run scripts/build-photo-assets.mjs`
    )
  }

  return {
    publicId: `${LOCAL_PUBLIC_ID_PREFIX}${entry.id}`,
    slug: entry.id,
    status: entry.hidden ? 'draft' : 'published',
    title: entry.title,
    alt: entry.alt,
    caption: entry.caption,
    category: entry.world,
    series: undefined,
    locationLabel: undefined,
    captureDate: asset.captureDate,
    sortOrder: entry.sortOrder,
    metadataVersion: 'v2',
    tags: entry.tags,
    metadata: {
      width: asset.width,
      height: asset.height,
      format: 'webp',
      bytes: 0,
      createdAt: ARCHIVE_CREATED_AT,
      camera: asset.camera,
      lens: asset.lens,
      focalLength: asset.focalLength,
      iso: asset.iso,
      shutterSpeed: asset.shutterSpeed,
      aperture: asset.aperture,
      gps: asset.gps,
      palette: asset.palette.length > 0 ? asset.palette : undefined,
    },
  }
})

export function getWorld(slug: string): WorldDefinition | null {
  return worlds.find((world) => world.slug === slug) ?? null
}

export function getPublicWorlds() {
  return worlds.filter((world) => !world.hidden)
}

export function getWorldPhotoIds(slug: WorldSlug) {
  return editorial.filter((entry) => entry.world === slug && !entry.hidden).map((entry) => entry.id)
}
