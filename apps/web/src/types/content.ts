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
} from '@frameos/content-schema'

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
  isDegraded: boolean
}

export interface ContactView {
  site: SiteSettings
  page: ContactPageContent
  canonicalUrl: string
  isDegraded: boolean
}
