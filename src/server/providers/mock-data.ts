import { createPhotoSlug } from '@/lib/photo-slug'
import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  SiteSettings,
} from '@/types/content'
import type { Photo } from '@/types/photo'

function buildFixturePhoto(input: Omit<Photo, 'slug' | 'metadataVersion'>): Photo {
  return {
    ...input,
    slug: createPhotoSlug(input.publicId),
    metadataVersion: 'v1',
  }
}

export const fixturePhotos: Photo[] = [
  buildFixturePhoto({
    publicId: 'samples/landscapes/nature-mountains',
    status: 'published',
    title: 'Dawn Before the Ridge',
    alt: 'A mountain ridge lit by early morning light under pale sky.',
    caption: 'Cold light over a quiet valley before the road wakes up.',
    category: 'landscape',
    series: 'first-light',
    locationLabel: 'Ladakh',
    captureDate: '2025-01-14T05:20:00.000Z',
    sortOrder: 90,
    tags: ['featured', 'travel', 'mountain'],
    metadata: {
      width: 1600,
      height: 1067,
      format: 'jpg',
      bytes: 245000,
      createdAt: '2025-01-14T05:20:00.000Z',
      updatedAt: '2025-01-14T05:20:00.000Z',
      camera: 'Fujifilm X-T5',
      lens: '33mm',
      iso: '200',
      shutterSpeed: '1/250',
      aperture: 'f/4',
      palette: ['#e8d2b0', '#7c8aa0', '#202e3c'],
    },
  }),
  buildFixturePhoto({
    publicId: 'samples/people/jazz',
    status: 'published',
    title: 'Quiet Interval',
    alt: 'A monochrome portrait of a musician holding a saxophone.',
    caption: 'Street portraiture works best when the moment is almost gone.',
    category: 'portrait',
    series: 'night-walks',
    locationLabel: 'Mumbai',
    captureDate: '2025-02-03T19:42:00.000Z',
    sortOrder: 82,
    tags: ['featured', 'portrait', 'night'],
    metadata: {
      width: 1400,
      height: 1867,
      format: 'jpg',
      bytes: 228000,
      createdAt: '2025-02-03T19:42:00.000Z',
      updatedAt: '2025-02-03T19:42:00.000Z',
      camera: 'Sony A7 IV',
      lens: '85mm',
      iso: '800',
      shutterSpeed: '1/160',
      aperture: 'f/1.8',
      palette: ['#e6e6e6', '#5d5d5d', '#111111'],
    },
  }),
  buildFixturePhoto({
    publicId: 'samples/landscapes/architecture-signs',
    status: 'published',
    title: 'Signal and Dust',
    alt: 'A dramatic city facade with signage and long shadows.',
    caption: 'Architecture becomes photographable when the light turns graphic.',
    category: 'street',
    series: 'concrete-heat',
    locationLabel: 'Jaipur',
    captureDate: '2025-03-11T16:25:00.000Z',
    sortOrder: 76,
    tags: ['featured', 'street', 'geometry'],
    metadata: {
      width: 1600,
      height: 1067,
      format: 'jpg',
      bytes: 232000,
      createdAt: '2025-03-11T16:25:00.000Z',
      updatedAt: '2025-03-11T16:25:00.000Z',
      camera: 'Leica Q2',
      lens: '28mm',
      iso: '100',
      shutterSpeed: '1/500',
      aperture: 'f/5.6',
      palette: ['#dcb68c', '#6f5439', '#1e1f22'],
    },
  }),
  buildFixturePhoto({
    publicId: 'samples/food/spices',
    status: 'published',
    title: 'Color Study No. 4',
    alt: 'A market arrangement of spices with warm saturated tones.',
    caption: 'Sometimes a gallery needs one image that exists only for color.',
    category: 'still-life',
    series: 'color-notes',
    locationLabel: 'Old Delhi',
    captureDate: '2025-01-28T11:10:00.000Z',
    sortOrder: 64,
    tags: ['market', 'color'],
    metadata: {
      width: 1600,
      height: 1066,
      format: 'jpg',
      bytes: 210000,
      createdAt: '2025-01-28T11:10:00.000Z',
      updatedAt: '2025-01-28T11:10:00.000Z',
      camera: 'Fujifilm X-T5',
      lens: '23mm',
      iso: '400',
      shutterSpeed: '1/125',
      aperture: 'f/2.8',
      palette: ['#c35726', '#dd9c44', '#552a17'],
    },
  }),
  buildFixturePhoto({
    publicId: 'samples/ecommerce/leather-bag-gray',
    status: 'draft',
    title: 'Studio Draft',
    alt: 'A draft studio frame kept out of the public gallery.',
    caption: 'This fixture stays draft to exercise publication guards.',
    category: 'drafts',
    series: 'archive',
    locationLabel: 'Studio',
    captureDate: '2025-03-22T10:00:00.000Z',
    sortOrder: 10,
    tags: ['draft'],
    metadata: {
      width: 1200,
      height: 1200,
      format: 'jpg',
      bytes: 118000,
      createdAt: '2025-03-22T10:00:00.000Z',
      updatedAt: '2025-03-22T10:00:00.000Z',
      camera: 'Sony A7 IV',
      lens: '50mm',
      iso: '100',
      shutterSpeed: '1/200',
      aperture: 'f/8',
      palette: ['#c8c2ba', '#7f786f', '#24201c'],
    },
  }),
]

export const fixtureSiteSettings: SiteSettings = {
  brandMark: 'FR',
  title: 'FrameOS',
  description:
    'An editorial photography portfolio built on Cloudinary, Sanity, and TanStack Start.',
  location: 'India',
  email: 'hello@example.com',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Behance', href: 'https://www.behance.net/' },
    { label: 'Mail', href: 'mailto:hello@example.com' },
  ],
  seo: {
    title: 'FrameOS Photography',
    description:
      'A restrained photography portfolio with cinematic galleries and typed content infrastructure.',
    imagePublicId: fixturePhotos[0].publicId,
  },
}

export const fixtureHomePage: HomePageContent = {
  eyebrow: 'Photography portfolio',
  headline: 'Photographs collected from slow streets, long roads, and borrowed light.',
  intro:
    'Built to keep uploads simple, metadata structured, and the front-end free to evolve without fighting the data layer.',
  featuredPhotos: fixturePhotos.slice(0, 3).map((photo) => ({
    publicId: photo.publicId,
    slug: photo.slug,
  })),
  cta: {
    label: 'Open the gallery',
    href: '/gallery',
  },
  seo: {
    title: 'FrameOS | Photography Portfolio',
    description: 'A cinematic portfolio site backed by Cloudinary and Sanity.',
    imagePublicId: fixturePhotos[0].publicId,
  },
}

export const fixtureAboutPage: AboutPageContent = {
  headline:
    'I photograph places the way memory keeps them: textured, quiet, and slightly unfinished.',
  body: [
    'This repo is set up so the photographs live in Cloudinary, the editorial story lives in Sanity, and the site consumes both through a clean repository contract.',
    'That gives you one upload flow for images, typed content for page-level storytelling, and enough structure to redesign the UI later without rebuilding the data layer.',
  ],
  photoHighlights: fixturePhotos.slice(1, 4).map((photo) => ({
    publicId: photo.publicId,
    slug: photo.slug,
  })),
  seo: {
    title: 'About | FrameOS',
    description: 'Background, process, and editorial notes for the FrameOS portfolio.',
    imagePublicId: fixturePhotos[1].publicId,
  },
}

export const fixtureContactPage: ContactPageContent = {
  headline: 'Available for commissions, portraits, travel stories, and quiet collaborations.',
  body: [
    'Use this page for direct inquiries, publication requests, or project conversations.',
    'In production you can keep the contact details in Sanity and update them without touching code.',
  ],
  email: 'hello@example.com',
  socials: fixtureSiteSettings.socials,
  seo: {
    title: 'Contact | FrameOS',
    description: 'Contact details and social links for FrameOS.',
  },
}
