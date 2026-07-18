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
    fallbackImage: '/media/pocket-worlds/keyframes/01-wander-1664.webp',
    fallbackSrcSet:
      '/media/pocket-worlds/keyframes/01-wander-768.webp 768w, /media/pocket-worlds/keyframes/01-wander-1280.webp 1280w, /media/pocket-worlds/keyframes/01-wander-1664.webp 1664w',
    fallbackAlt: 'A luminous miniature coast leading through waterfalls toward distant worlds.',
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
    fallbackImage: '/media/pocket-worlds/keyframes/02-sacred-geometry-1664.webp',
    fallbackSrcSet:
      '/media/pocket-worlds/keyframes/02-sacred-geometry-768.webp 768w, /media/pocket-worlds/keyframes/02-sacred-geometry-1280.webp 1280w, /media/pocket-worlds/keyframes/02-sacred-geometry-1664.webp 1664w',
    fallbackAlt: 'A golden route climbing through a monumental miniature temple landscape.',
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
    fallbackImage: '/media/pocket-worlds/keyframes/03-small-wonders-1664.webp',
    fallbackSrcSet:
      '/media/pocket-worlds/keyframes/03-small-wonders-768.webp 768w, /media/pocket-worlds/keyframes/03-small-wonders-1280.webp 1280w, /media/pocket-worlds/keyframes/03-small-wonders-1664.webp 1664w',
    fallbackAlt: 'A dew-covered leaf world where a golden path refracts through a giant droplet.',
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
    fallbackImage: '/media/pocket-worlds/keyframes/04-living-things-1664.webp',
    fallbackSrcSet:
      '/media/pocket-worlds/keyframes/04-living-things-768.webp 768w, /media/pocket-worlds/keyframes/04-living-things-1280.webp 1280w, /media/pocket-worlds/keyframes/04-living-things-1664.webp 1664w',
    fallbackAlt: 'A quiet parakeet discovered beside a captured-light path beneath the canopy.',
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
    fallbackImage: '/media/pocket-worlds/keyframes/05-table-notes-1664.webp',
    fallbackSrcSet:
      '/media/pocket-worlds/keyframes/05-table-notes-768.webp 768w, /media/pocket-worlds/keyframes/05-table-notes-1280.webp 1280w, /media/pocket-worlds/keyframes/05-table-notes-1664.webp 1664w',
    fallbackAlt: 'A warm circular gathering where the light resolves into an archive motif.',
  },
] as const satisfies ReadonlyArray<PocketWorldJourneyScene>

export const pocketWorldHero = {
  eyebrow: 'FrameOS — Pocket Worlds',
  title: 'Things I noticed, photographed on a phone.',
  body: 'Follow the light through five small worlds.',
  fallbackImage: '/media/pocket-worlds/keyframes/00-overview-1664.webp',
  fallbackSrcSet:
    '/media/pocket-worlds/keyframes/00-overview-768.webp 768w, /media/pocket-worlds/keyframes/00-overview-1280.webp 1280w, /media/pocket-worlds/keyframes/00-overview-1664.webp 1664w',
} as const
