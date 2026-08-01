/**
 * Local archive fixtures.
 *
 * When Sanity is not configured, the provider serves this bundled launch
 * content instead: the real curated Pocket Worlds photo set plus the
 * editorial page copy. Once Sanity credentials exist, the provider layer
 * switches to live data automatically and this module is ignored.
 */
import { curatedPhotos, getPublicWorlds } from '@/content/worlds'

import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  PhotoRef,
  SiteSettings,
} from '@/types/content'
import type { Photo } from '@/types/photo'

export const fixturePhotos: Photo[] = curatedPhotos

const publishedPhotos = curatedPhotos.filter((photo) => photo.status === 'published')

function findPublishedPhoto(id: string) {
  return publishedPhotos.find((photo) => photo.slug === id)
}

function refsForIds(ids: string[]): PhotoRef[] {
  return ids
    .map((id) => findPublishedPhoto(id))
    .filter((photo): photo is Photo => Boolean(photo))
    .map((photo) => ({ slug: photo.slug }))
}

const heroPhotos = getPublicWorlds()
  .map((world) => findPublishedPhoto(world.heroId))
  .filter((photo): photo is Photo => Boolean(photo))
const heroRefs = heroPhotos.map((photo) => ({ slug: photo.slug }))

export const fixtureSiteSettings: SiteSettings = {
  brandMark: 'FO',
  title: 'FrameOS — Pocket Worlds',
  description: 'Things I noticed, photographed on a phone.',
  location: 'India',
  email: '66naren@gmail.com',
  socials: [{ label: 'Mail', href: 'mailto:66naren@gmail.com' }],
  seo: {
    title: 'FrameOS — Pocket Worlds',
    description:
      'A personal archive of things noticed and photographed on a phone: travel, temples, small wonders, living things, and food.',
    imagePublicId: heroPhotos[0]?.publicId,
  },
}

export const fixtureHomePage: HomePageContent = {
  eyebrow: 'Pocket Worlds',
  headline: 'Things I noticed, photographed on a phone.',
  intro:
    'No studio. No heavy gear. Just a phone, a moment, and the instinct to notice. Each photograph here is a small world — step into one.',
  featuredPhotos: heroRefs,
  cta: {
    label: 'Explore the worlds',
    href: '/',
  },
  seo: {
    title: 'FrameOS — Pocket Worlds',
    description:
      'A world noticed through a pocket-sized frame: travel, temples, small wonders, living things, and food, photographed entirely on a phone.',
    imagePublicId: heroPhotos[0]?.publicId,
  },
}

export const fixtureAboutPage: AboutPageContent = {
  headline: 'I keep the camera I always have with me.',
  body: [
    'Everything in this archive was photographed on a phone. Not as a constraint to apologise for, but as the whole point: the phone is the camera that is present when something worth noticing happens.',
    'Most of these frames were not planned. A leaf held rain a little longer than expected. A tower stood still under a moving sky. A cat decided, briefly, to trust. The photographs exist because the noticing came first.',
    'The archive is grouped into small worlds — travel, temples, close things, living things, food — because that is roughly how the noticing happens too.',
  ],
  photoHighlights: refsForIds(['cosmos', 'white-tower', 'the-cat', 'rain-on-the-street']),
  seo: {
    title: 'Field Notes — FrameOS',
    description:
      'Who is behind FrameOS, why the archive is mobile-only, and what tends to get noticed.',
    imagePublicId: heroPhotos[0]?.publicId,
  },
}

export const fixtureContactPage: ContactPageContent = {
  headline: 'Found something familiar? Send a signal.',
  body: [
    'If one of these frames reminded you of a place, a meal, or an afternoon — that is the best possible outcome. Write and say so.',
    'Questions about the photographs are welcome too.',
  ],
  email: '66naren@gmail.com',
  socials: fixtureSiteSettings.socials,
  seo: {
    title: 'Signal — FrameOS',
    description: 'Get in touch about the FrameOS archive.',
  },
}
