import type {
  AboutView,
  AboutPageContent,
  ContactView,
  ContactPageContent,
  HomeView,
  HomePageContent,
  PageDocumentId,
  SiteSettings,
} from '@/types/content'
import type { GalleryFeed, Photo, PhotoDetailView, PhotoFilters } from '@/types/photo'

export type SanityDocumentId = PageDocumentId | 'photo'

export interface SanityProvider {
  getSiteSettings: () => Promise<SiteSettings | null>
  getHomePage: () => Promise<HomePageContent | null>
  getAboutPage: () => Promise<AboutPageContent | null>
  getContactPage: () => Promise<ContactPageContent | null>
  searchPhotos: (filters: PhotoFilters) => Promise<{ photos: Photo[]; nextCursor?: string }>
  getPhotoBySlug: (slug: string) => Promise<Photo | null>
  listChangedPhotos: (sinceIso: string) => Promise<Photo[]>
  listChangedDocuments: (sinceIso: string) => Promise<SanityDocumentId[]>
  verifyWebhook: (
    request: Request,
    bodyText: string
  ) => Promise<{
    ok: boolean
    reason?: string
    documentId?: SanityDocumentId
    idempotencyKey?: string
    updatedAt?: string
  }>
}

export interface PortfolioRepository {
  getGalleryFeed: (filters: PhotoFilters, options: { baseUrl: string }) => Promise<GalleryFeed>
  getPhotoDetail: (slug: string, options: { baseUrl: string }) => Promise<PhotoDetailView | null>
  getHomeView: (options: { baseUrl: string }) => Promise<HomeView>
  getAboutView: (options: { baseUrl: string }) => Promise<AboutView>
  getContactView: (options: { baseUrl: string }) => Promise<ContactView>
  getSeoPayload: (
    routeId: PageDocumentId | 'gallery' | 'photo',
    options: { slug?: string; baseUrl: string }
  ) => Promise<{
    title: string
    description: string
    canonicalUrl: string
    robots?: string
  }>
  reconcileFromWebhook: (
    provider: 'sanity',
    payload: Record<string, unknown>
  ) => Promise<{ invalidatedTags: string[]; degraded: boolean }>
  reconcileSince: (sinceIso: string) => Promise<{ invalidatedTags: string[]; degraded: boolean }>
}
