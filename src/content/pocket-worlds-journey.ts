import type { WorldSlug } from '@/content/worlds'

export type PocketWorldSceneId =
  'wander' | 'sacred-geometry' | 'small-wonders' | 'living-things' | 'table-notes'

export interface PocketWorldJourneyScene {
  id: PocketWorldSceneId
  worldSlug: WorldSlug
  label: string
  eyebrow: string
  title: string
  body: string
  action: string
  accent: string
  copySide: 'left' | 'right'
  scrollWeight: number
  linger: number
  fallbackImage: string
  fallbackSrcSet: string
  fallbackAlt: string
}

export const pocketWorldJourney = [
  {
    id: 'wander',
    worldSlug: 'wander',
    label: 'Wander',
    eyebrow: 'World 01 · Open air',
    title: 'Wander',
    body: 'Places passed through, horizons kept.',
    action: 'Enter Wander',
    accent: '#79aeb8',
    copySide: 'left',
    scrollWeight: 1.65,
    linger: 0.3,
    fallbackImage: '/photos/the-sea/w1440.webp',
    fallbackSrcSet:
      '/photos/the-sea/w768.webp 768w, /photos/the-sea/w1024.webp 1024w, /photos/the-sea/w1440.webp 1440w, /photos/the-sea/w2048.webp 2048w',
    fallbackAlt: 'Waves breaking beneath a pale sky and an open horizon.',
  },
  {
    id: 'sacred-geometry',
    worldSlug: 'sacred-geometry',
    label: 'Sacred Geometry',
    eyebrow: 'World 02 · Built skyward',
    title: 'Sacred Geometry',
    body: 'Stone, sky, ritual, and repetition.',
    action: 'Enter Sacred Geometry',
    accent: '#d78b60',
    copySide: 'right',
    scrollWeight: 1.42,
    linger: 0.22,
    fallbackImage: '/photos/tower-and-sky/w1440.webp',
    fallbackSrcSet:
      '/photos/tower-and-sky/w768.webp 768w, /photos/tower-and-sky/w1024.webp 1024w, /photos/tower-and-sky/w1440.webp 1440w, /photos/tower-and-sky/w1469.webp 1469w',
    fallbackAlt: 'A carved temple tower rising beneath a streaked sky.',
  },
  {
    id: 'small-wonders',
    worldSlug: 'small-wonders',
    label: 'Small Wonders',
    eyebrow: 'World 03 · At another scale',
    title: 'Small Wonders',
    body: 'The closer you look, the larger it gets.',
    action: 'Look closer',
    accent: '#b7cf66',
    copySide: 'left',
    scrollWeight: 1.5,
    linger: 0.34,
    fallbackImage: '/photos/leaf-after-rain/w1440.webp',
    fallbackSrcSet:
      '/photos/leaf-after-rain/w768.webp 768w, /photos/leaf-after-rain/w1024.webp 1024w, /photos/leaf-after-rain/w1440.webp 1440w, /photos/leaf-after-rain/w1469.webp 1469w',
    fallbackAlt: 'A heart-shaped leaf holding round droplets after rain.',
  },
  {
    id: 'living-things',
    worldSlug: 'living-things',
    label: 'Living Things',
    eyebrow: 'World 04 · Shared distance',
    title: 'Living Things',
    body: 'Company that chooses its own distance.',
    action: 'Enter quietly',
    accent: '#73a77d',
    copySide: 'right',
    scrollWeight: 1.46,
    linger: 0.38,
    fallbackImage: '/photos/parakeet/w1440.webp',
    fallbackSrcSet:
      '/photos/parakeet/w768.webp 768w, /photos/parakeet/w1024.webp 1024w, /photos/parakeet/w1440.webp 1440w, /photos/parakeet/w1956.webp 1956w',
    fallbackAlt: 'A green parakeet perched inside a deep canopy.',
  },
  {
    id: 'table-notes',
    worldSlug: 'at-the-table',
    label: 'Table Notes',
    eyebrow: 'World 05 · Gathered close',
    title: 'Table Notes',
    body: 'Meals worth interrupting.',
    action: 'Enter Table Notes',
    accent: '#e4a25d',
    copySide: 'left',
    scrollWeight: 1.78,
    linger: 0.42,
    fallbackImage: '/photos/banana-leaf-meal/w1440.webp',
    fallbackSrcSet:
      '/photos/banana-leaf-meal/w768.webp 768w, /photos/banana-leaf-meal/w1024.webp 1024w, /photos/banana-leaf-meal/w1440.webp 1440w, /photos/banana-leaf-meal/w2048.webp 2048w',
    fallbackAlt: 'A complete meal arranged in a circle on a banana leaf.',
  },
] as const satisfies ReadonlyArray<PocketWorldJourneyScene>

export const pocketWorldHero = {
  eyebrow: 'FrameOS — Pocket Worlds',
  title: 'Things I noticed, photographed on a phone.',
  body: 'Follow the light through five small worlds.',
} as const
