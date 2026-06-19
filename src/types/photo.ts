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
  iso?: string
  shutterSpeed?: string
  aperture?: string
  gps?: string
  palette?: string[]
}

export interface Photo {
  publicId: string
  slug: string
  status: PhotoStatus
  title: string
  alt: string
  caption?: string
  category?: string
  series?: string
  locationLabel?: string
  captureDate?: string
  sortOrder: number
  metadataVersion: 'v1'
  tags: string[]
  metadata: PhotoMetadata
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
