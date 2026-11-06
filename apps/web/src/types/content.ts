import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  PhotoRef,
  SiteSettings,
} from '@frameos/content-schema'

export type {
  AboutPageContent,
  ContactPageContent,
  Cta,
  HomePageContent,
  PageDocumentId,
  PhotoRef,
  SeoFields,
  SiteSettings,
  SocialLink,
  World,
  WorldMood,
  WorldStatus,
} from '@frameos/content-schema'

/** An absolute image URL for Open Graph / Twitter cards and structured data. */
export interface ShareImage {
  url: string
  width?: number
  height?: number
  /** MIME type, e.g. `image/jpeg`. */
  type?: string
  alt: string
}

export interface HomeView {
  site: SiteSettings
  page: HomePageContent
  featuredPhotos: PhotoRef[]
  featuredItems: {
    photoHref: string
    title: string
    location?: string
    imagePublicId: string
    imageLqip?: string
    imageHotspot?: { x: number; y: number }
    alt: string
  }[]
  canonicalUrl: string
  /** Resolved server-side from `page.seo.imagePublicId`, else the first featured photo. */
  shareImage?: ShareImage
  isDegraded: boolean
}

export interface AboutView {
  site: SiteSettings
  page: AboutPageContent
  gallery: {
    photoHref: string
    title: string
    imagePublicId: string
    imageLqip?: string
    imageHotspot?: { x: number; y: number }
    alt: string
  }[]
  canonicalUrl: string
  /** Resolved server-side from `page.seo.imagePublicId`, else the first highlighted photo. */
  shareImage?: ShareImage
  isDegraded: boolean
}

export interface ContactView {
  site: SiteSettings
  page: ContactPageContent
  canonicalUrl: string
  /** Resolved server-side from `page.seo.imagePublicId`. */
  shareImage?: ShareImage
  isDegraded: boolean
}
