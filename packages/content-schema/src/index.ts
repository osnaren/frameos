export interface SeoFields {
  title: string
  description: string
  imagePublicId?: string
}

/** A curated reference to a `photo` Sanity document, resolved to the full Photo by slug. */
export interface PhotoRef {
  slug: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface Cta {
  label: string
  href: string
}

export interface SiteSettings {
  brandMark?: string
  title: string
  description: string
  location?: string
  email?: string
  socials: SocialLink[]
  seo: SeoFields
}

export interface HomePageContent {
  eyebrow: string
  headline: string
  intro: string
  featuredPhotos: PhotoRef[]
  cta?: Cta
  seo: SeoFields
}

export interface AboutPageContent {
  headline: string
  body: string[]
  photoHighlights: PhotoRef[]
  seo: SeoFields
}

export interface ContactPageContent {
  headline: string
  body: string[]
  email?: string
  socials: SocialLink[]
  seo: SeoFields
}

export type PageDocumentId = 'siteSettings' | 'homePage' | 'aboutPage' | 'contactPage'

export type PhotoStatus = 'draft' | 'published' | 'archived'

export interface PhotoMetadata {
  width: number
  height: number
  format: string
  bytes: number
  createdAt: string
  updatedAt?: string
  camera?: string
  lens?: string
  focalLength?: string
  iso?: string
  shutterSpeed?: string
  aperture?: string
  gps?: string
  palette?: string[]
}

/** Rendering hints available only for live Sanity-hosted images (not the local fixture archive). */
export interface PhotoImageHints {
  /** Base64 blur data URI, used directly as the placeholder — no extra network request. */
  lqip?: string
  /** Editor-set focal point (0..1), used for hotspot-aware cropped presets. */
  hotspot?: { x: number; y: number }
}

export interface Photo {
  /** Local fixture id (`local/<id>`) or a Sanity image CDN base URL — see PhotoImage. */
  publicId: string
  slug: string
  status: PhotoStatus
  title: string
  alt: string
  description?: string
  caption?: string
  category?: string
  series?: string
  locationLabel?: string
  captureDate?: string
  sortOrder: number
  metadataVersion: 'v2'
  tags: string[]
  metadata: PhotoMetadata
  image?: PhotoImageHints
}
