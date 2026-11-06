import type { Photo } from '@frameos/content-schema'

export type { Photo, PhotoImageHints, PhotoMetadata, PhotoStatus } from '@frameos/content-schema'

export interface PhotoFilters {
  category?: string
  series?: string
  tag?: string
  after?: string
  limit?: number
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
