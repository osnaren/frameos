export type PhotoStatus = 'draft' | 'published' | 'archived'

export interface PhotoFilters {
  category?: string
  series?: string
  tag?: string
  after?: string
  limit?: number
}

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

export interface PhotoCardView {
  photo: Photo
  href: string
}

export interface GalleryFeed {
  items: PhotoCardView[]
  nextCursor?: string
  canonicalUrl: string
  robots: string
  appliedFilters: Required<Pick<PhotoFilters, 'category' | 'series' | 'tag'>> & {
    after?: string
    limit: number
  }
  isDegraded: boolean
  errorMessage?: string
}

export interface PhotoDetailView {
  photo: Photo
  canonicalUrl: string
  isDegraded: boolean
}
