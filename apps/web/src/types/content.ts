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

export type PageDocumentId = 'siteSettings' | 'homePage' | 'aboutPage' | 'contactPage'
