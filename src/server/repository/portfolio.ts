import { buildCanonicalGallerySearch } from '@/lib/gallery-search'
import { buildCanonicalUrl } from '@/lib/url'
import { readSnapshot, rememberSnapshot } from '@/server/cache/snapshots'
import { getPageTags, getPhotoTags } from '@/server/cache/tags'
import { invalidateCacheTags } from '@/server/cache/vercel'
import { captureException } from '@/server/observability/error-tracker'
import { logInfo, logWarn, recordMetric } from '@/server/observability/logger'
import { createSanityProvider, invalidateAllPhotosCache } from '@/server/providers/sanity'

import type { PortfolioRepository, SanityDocumentId } from '@/server/contracts'
import type { AboutView, ContactView, HomeView, SiteSettings } from '@/types/content'
import type { GalleryFeed, Photo, PhotoDetailView } from '@/types/photo'

class ServiceUnavailableError extends Error {
  statusCode = 503
}

function ensurePublishedPhoto(photo: Photo | null) {
  if (!photo) {
    return null
  }

  if (photo.status !== 'published' || !photo.alt.trim()) {
    return null
  }

  return photo
}

function getFallbackSiteSettings(): SiteSettings {
  return {
    title: 'FrameOS',
    description: 'Photography portfolio',
    socials: [],
    seo: {
      title: 'FrameOS',
      description: 'Photography portfolio',
    },
  }
}

function resolveFeaturedItems(photos: Photo[]) {
  return photos.map((photo) => ({
    photoHref: `/photos/${photo.slug}`,
    title: photo.title,
    location: photo.locationLabel,
    imagePublicId: photo.publicId,
    imageLqip: photo.image?.lqip,
    imageHotspot: photo.image?.hotspot,
    alt: photo.alt,
  }))
}

export function createPortfolioRepository(): PortfolioRepository {
  const sanityProvider = createSanityProvider()

  async function loadSiteSettings() {
    try {
      return (await sanityProvider.getSiteSettings()) ?? getFallbackSiteSettings()
    } catch (error) {
      captureException(error, {
        route: 'siteSettings',
        outcome: 'fallback',
      })
      logWarn('repository.site-settings.fallback', {
        outcome: 'fallback',
      })
      return getFallbackSiteSettings()
    }
  }

  async function resolvePhotosByRefs(refs: Array<{ slug: string }>) {
    const resolved = await Promise.all(refs.map((ref) => sanityProvider.getPhotoBySlug(ref.slug)))

    return resolved
      .map((photo) => ensurePublishedPhoto(photo))
      .filter((photo): photo is Photo => Boolean(photo))
  }

  function getSnapshotKey(type: string, suffix = 'default') {
    return `${type}:${suffix}`
  }

  async function addCuratedPageTags(slugs: string[], tags: Set<string>) {
    if (slugs.length === 0) {
      return false
    }

    try {
      const [homePage, aboutPage] = await Promise.all([
        sanityProvider.getHomePage(),
        sanityProvider.getAboutPage(),
      ])
      const slugSet = new Set(slugs)

      if (homePage?.featuredPhotos.some((ref) => slugSet.has(ref.slug))) {
        tags.add('page:home')
      }

      if (aboutPage?.photoHighlights.some((ref) => slugSet.has(ref.slug))) {
        tags.add('page:about')
      }

      return false
    } catch (error) {
      captureException(error, {
        provider: 'sanity',
        outcome: 'curation-lookup-failed',
      })
      return true
    }
  }

  return {
    async getGalleryFeed(filters, options) {
      const query = buildCanonicalGallerySearch({
        category: filters.category,
        series: filters.series,
        tag: filters.tag,
        after: filters.after,
        limit: filters.limit ?? 24,
      })
      const snapshotKey = getSnapshotKey('gallery', query || 'default')
      const startedAt = Date.now()

      try {
        const response = await sanityProvider.searchPhotos(filters)
        const publishedItems = response.photos
          .map((photo) => ensurePublishedPhoto(photo))
          .filter((photo): photo is Photo => Boolean(photo))

        const result: GalleryFeed = {
          items: publishedItems.map((photo) => ({
            photo,
            href: `/photos/${photo.slug}`,
          })),
          nextCursor: response.nextCursor,
          canonicalUrl: buildCanonicalUrl(options.baseUrl, '/gallery', query),
          robots: filters.after ? 'noindex,follow' : 'index,follow',
          appliedFilters: {
            category: filters.category ?? '',
            series: filters.series ?? '',
            tag: filters.tag ?? '',
            after: filters.after,
            limit: filters.limit ?? 24,
          },
          isDegraded: false,
        }

        recordMetric('repository.gallery.latency_ms', Date.now() - startedAt, {
          outcome: 'success',
        })

        return rememberSnapshot(snapshotKey, result)
      } catch (error) {
        captureException(error, {
          route: 'gallery',
          outcome: 'failure',
        })

        const snapshot = readSnapshot<GalleryFeed>(snapshotKey)
        if (snapshot) {
          logWarn('repository.gallery.stale', {
            outcome: 'stale',
            route: 'gallery',
          })
          return {
            ...snapshot,
            isDegraded: true,
            errorMessage:
              'The latest content is temporarily unavailable. Showing the last successful snapshot.',
          }
        }

        return {
          items: [],
          nextCursor: undefined,
          canonicalUrl: buildCanonicalUrl(options.baseUrl, '/gallery'),
          robots: 'index,follow',
          appliedFilters: {
            category: filters.category ?? '',
            series: filters.series ?? '',
            tag: filters.tag ?? '',
            after: filters.after,
            limit: filters.limit ?? 24,
          },
          isDegraded: true,
          errorMessage:
            'The gallery is temporarily unavailable while the content provider is recovering. Please try again shortly.',
        }
      }
    },
    async getPhotoDetail(slug, options) {
      const snapshotKey = getSnapshotKey('photo', slug)

      try {
        const photo = ensurePublishedPhoto(await sanityProvider.getPhotoBySlug(slug))

        if (!photo) {
          return null
        }

        const result: PhotoDetailView = {
          photo,
          canonicalUrl: buildCanonicalUrl(options.baseUrl, `/photos/${photo.slug}`),
          isDegraded: false,
        }

        return rememberSnapshot(snapshotKey, result)
      } catch (error) {
        captureException(error, {
          route: 'photo',
          slug,
          outcome: 'failure',
        })

        const snapshot = readSnapshot<PhotoDetailView>(snapshotKey)
        if (snapshot) {
          return {
            ...snapshot,
            isDegraded: true,
          }
        }

        throw new ServiceUnavailableError(
          'This photograph is temporarily unavailable while Sanity is recovering.'
        )
      }
    },
    async getHomeView(options) {
      const snapshotKey = getSnapshotKey('page', 'home')

      try {
        const [site, page] = await Promise.all([loadSiteSettings(), sanityProvider.getHomePage()])

        if (!page) {
          throw new ServiceUnavailableError('Home page content is unavailable.')
        }

        const featuredPhotos = await resolvePhotosByRefs(page.featuredPhotos)
        const result: HomeView = {
          site,
          page,
          featuredPhotos: page.featuredPhotos,
          featuredItems: resolveFeaturedItems(featuredPhotos),
          canonicalUrl: buildCanonicalUrl(options.baseUrl, '/'),
          isDegraded: false,
        }

        return rememberSnapshot(snapshotKey, result)
      } catch (error) {
        captureException(error, {
          route: 'home',
          outcome: 'failure',
        })

        const snapshot = readSnapshot<HomeView>(snapshotKey)
        if (snapshot) {
          return {
            ...snapshot,
            isDegraded: true,
          }
        }

        throw new ServiceUnavailableError(
          'The home page content is temporarily unavailable while Sanity is recovering.'
        )
      }
    },
    async getAboutView(options) {
      const snapshotKey = getSnapshotKey('page', 'about')

      try {
        const [site, page] = await Promise.all([loadSiteSettings(), sanityProvider.getAboutPage()])

        if (!page) {
          throw new ServiceUnavailableError('About page content is unavailable.')
        }

        const photos = await resolvePhotosByRefs(page.photoHighlights)

        const result: AboutView = {
          site,
          page,
          gallery: resolveFeaturedItems(photos),
          canonicalUrl: buildCanonicalUrl(options.baseUrl, '/about'),
          isDegraded: false,
        }

        return rememberSnapshot(snapshotKey, result)
      } catch (error) {
        captureException(error, {
          route: 'about',
          outcome: 'failure',
        })

        const snapshot = readSnapshot<AboutView>(snapshotKey)
        if (snapshot) {
          return {
            ...snapshot,
            isDegraded: true,
          }
        }

        throw new ServiceUnavailableError(
          'The about page is temporarily unavailable while Sanity is recovering.'
        )
      }
    },
    async getContactView(options) {
      const snapshotKey = getSnapshotKey('page', 'contact')

      try {
        const [site, page] = await Promise.all([
          loadSiteSettings(),
          sanityProvider.getContactPage(),
        ])

        if (!page) {
          throw new ServiceUnavailableError('Contact page content is unavailable.')
        }

        const result: ContactView = {
          site,
          page,
          canonicalUrl: buildCanonicalUrl(options.baseUrl, '/contact'),
          isDegraded: false,
        }

        return rememberSnapshot(snapshotKey, result)
      } catch (error) {
        captureException(error, {
          route: 'contact',
          outcome: 'failure',
        })

        const snapshot = readSnapshot<ContactView>(snapshotKey)
        if (snapshot) {
          return {
            ...snapshot,
            isDegraded: true,
          }
        }

        throw new ServiceUnavailableError(
          'The contact page is temporarily unavailable while Sanity is recovering.'
        )
      }
    },
    async getSeoPayload(routeId, options) {
      switch (routeId) {
        case 'siteSettings': {
          const site = await loadSiteSettings()
          return {
            title: site.seo.title,
            description: site.seo.description,
            canonicalUrl: buildCanonicalUrl(options.baseUrl, '/'),
          }
        }
        case 'homePage': {
          const view = await this.getHomeView(options)
          return {
            title: view.page.seo.title,
            description: view.page.seo.description,
            canonicalUrl: view.canonicalUrl,
          }
        }
        case 'aboutPage': {
          const view = await this.getAboutView(options)
          return {
            title: view.page.seo.title,
            description: view.page.seo.description,
            canonicalUrl: view.canonicalUrl,
          }
        }
        case 'contactPage': {
          const view = await this.getContactView(options)
          return {
            title: view.page.seo.title,
            description: view.page.seo.description,
            canonicalUrl: view.canonicalUrl,
          }
        }
        case 'gallery':
          return {
            title: 'Gallery | FrameOS',
            description: 'Photography gallery filtered by category, series, and tag.',
            canonicalUrl: buildCanonicalUrl(options.baseUrl, '/gallery'),
            robots: options.slug ? 'noindex,follow' : 'index,follow',
          }
        case 'photo': {
          if (!options.slug) {
            throw new ServiceUnavailableError('Photo slug is required for SEO.')
          }

          const detail = await this.getPhotoDetail(options.slug, options)
          if (!detail) {
            throw new ServiceUnavailableError('Photo not found.')
          }

          return {
            title: `${detail.photo.title} | FrameOS`,
            description: detail.photo.caption ?? detail.photo.alt,
            canonicalUrl: detail.canonicalUrl,
          }
        }
      }
    },
    async reconcileFromWebhook(provider, payload) {
      const startedAt = Date.now()
      const tags = new Set<string>()
      let degraded = false

      const documentId = payload.documentId as SanityDocumentId | undefined

      if (documentId === 'photo') {
        tags.add('gallery')
        const slug = typeof payload.slug === 'string' ? payload.slug : undefined

        if (slug) {
          const photo = await sanityProvider.getPhotoBySlug(slug)

          if (photo) {
            getPhotoTags(photo).forEach((tag) => tags.add(tag))
          } else {
            tags.add(`photo:${slug}`)
            degraded = true
          }

          degraded = (await addCuratedPageTags([slug], tags)) || degraded
        } else {
          degraded = true
        }
      } else if (documentId) {
        getPageTags(documentId).forEach((tag) => tags.add(tag))
      } else {
        getPageTags('siteSettings').forEach((tag) => tags.add(tag))
      }

      const invalidatedTags = await invalidateCacheTags(Array.from(tags))
      invalidateAllPhotosCache()

      logInfo('repository.reconcile.webhook', {
        provider,
        cacheTags: invalidatedTags,
        durationMs: Date.now() - startedAt,
        outcome: degraded ? 'degraded' : 'success',
      })

      return {
        invalidatedTags,
        degraded,
      }
    },
    async reconcileSince(sinceIso) {
      const tags = new Set<string>()
      let degraded = false

      try {
        const [changedDocuments, changedPhotos] = await Promise.all([
          sanityProvider.listChangedDocuments(sinceIso),
          sanityProvider.listChangedPhotos(sinceIso),
        ])

        changedDocuments.forEach((documentId) => {
          if (documentId === 'photo') {
            tags.add('gallery')
          } else {
            getPageTags(documentId).forEach((tag) => tags.add(tag))
          }
        })

        changedPhotos.forEach((photo) => {
          getPhotoTags(photo).forEach((tag) => tags.add(tag))
        })

        degraded =
          (await addCuratedPageTags(
            changedPhotos.map((photo) => photo.slug),
            tags
          )) || degraded
      } catch (error) {
        degraded = true
        captureException(error, {
          outcome: 'reconcile-since-failed',
        })
      }

      const invalidatedTags = await invalidateCacheTags(Array.from(tags))
      invalidateAllPhotosCache()

      return {
        invalidatedTags,
        degraded,
      }
    },
  }
}

export { ServiceUnavailableError }
