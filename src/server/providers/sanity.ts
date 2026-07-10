import { createClient } from '@sanity/client'
import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'

import { createPhotoSlug } from '@/lib/photo-slug'
import type { SanityProvider } from '@/server/contracts'
import { getServerEnv, hasSanityConfig } from '@/server/env'
import { captureException, emitAlert } from '@/server/observability/error-tracker'
import { logWarn, recordMetric } from '@/server/observability/logger'
import {
  fixtureAboutPage,
  fixtureContactPage,
  fixtureHomePage,
  fixtureSiteSettings,
} from '@/server/providers/mock-data'
import type {
  AboutPageContent,
  CloudinaryAssetRef,
  ContactPageContent,
  HomePageContent,
  PageDocumentId,
  SiteSettings,
} from '@/types/content'

type SanityAssetRefValue = {
  asset?: {
    public_id?: string
  }
}

type SanitySeo = {
  title?: string
  description?: string
  imagePublicId?: string
}

type SanityPageBase = {
  seo?: SanitySeo
}

type SanityHomeDocument = SanityPageBase & {
  eyebrow?: string
  headline?: string
  intro?: string
  cta?: {
    label?: string
    href?: string
  }
  featuredPhotos?: SanityAssetRefValue[]
}

type SanityAboutDocument = SanityPageBase & {
  headline?: string
  body?: string[]
  photoHighlights?: SanityAssetRefValue[]
}

type SanityContactDocument = SanityPageBase & {
  headline?: string
  body?: string[]
  email?: string
  socials?: Array<{ label?: string; href?: string }>
}

let sanityClient: ReturnType<typeof createClient> | null = null

function getSanityClient() {
  if (!hasSanityConfig()) {
    return null
  }

  if (sanityClient) {
    return sanityClient
  }

  const env = getServerEnv()

  sanityClient = createClient({
    apiVersion: env.SANITY_API_VERSION,
    dataset: env.SANITY_DATASET!,
    projectId: env.SANITY_PROJECT_ID!,
    token: env.SANITY_API_TOKEN,
    perspective: 'published',
    useCdn: false,
  })

  return sanityClient
}

/** Without Sanity credentials the provider serves bundled editorial copy in any environment. */
function isLocalArchiveMode() {
  return !hasSanityConfig()
}

function mapAssetRefs(values: SanityAssetRefValue[] | undefined): CloudinaryAssetRef[] {
  return (values ?? [])
    .map((value) => value.asset?.public_id)
    .filter((publicId): publicId is string => typeof publicId === 'string' && publicId.length > 0)
    .map((publicId) => ({
      publicId,
      slug: createPhotoSlug(publicId),
    }))
}

function normalizeSeo(
  input: SanitySeo | undefined,
  fallbackTitle: string,
  fallbackDescription: string
) {
  return {
    title: input?.title?.trim() || fallbackTitle,
    description: input?.description?.trim() || fallbackDescription,
    imagePublicId: input?.imagePublicId?.trim(),
  }
}

async function fetchSanityDocument<T>(query: string, params?: Record<string, unknown>) {
  if (isLocalArchiveMode()) {
    return null as T | null
  }

  const client = getSanityClient()

  if (!client) {
    throw new Error('Sanity configuration is missing.')
  }

  const startedAt = Date.now()

  try {
    const result = await client.fetch<T>(query, params ?? {})
    recordMetric('provider.sanity.latency_ms', Date.now() - startedAt, {
      provider: 'sanity',
      outcome: 'success',
    })
    return result
  } catch (error) {
    captureException(error, {
      provider: 'sanity',
      outcome: 'failure',
    })
    emitAlert('sanity.read.failed', {
      provider: 'sanity',
      query,
    })
    throw error
  }
}

const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  brandMark,
  title,
  description,
  location,
  email,
  socials[]{
    label,
    href
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const homePageQuery = `*[_type == "homePage"][0]{
  eyebrow,
  headline,
  intro,
  cta{
    label,
    href
  },
  featuredPhotos[]{
    asset
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const aboutPageQuery = `*[_type == "aboutPage"][0]{
  headline,
  body,
  photoHighlights[]{
    asset
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

const contactPageQuery = `*[_type == "contactPage"][0]{
  headline,
  body,
  email,
  socials[]{
    label,
    href
  },
  seo{
    title,
    description,
    imagePublicId
  }
}`

export function createSanityProvider(): SanityProvider {
  return {
    async getSiteSettings() {
      if (isLocalArchiveMode()) {
        return fixtureSiteSettings
      }

      const document = await fetchSanityDocument<SiteSettings>(siteSettingsQuery)

      if (!document) {
        return null
      }

      return {
        brandMark: document.brandMark,
        title: document.title,
        description: document.description,
        location: document.location,
        email: document.email,
        socials: document.socials,
        seo: normalizeSeo(document.seo, document.title, document.description),
      }
    },
    async getHomePage() {
      if (isLocalArchiveMode()) {
        return fixtureHomePage
      }

      const document = await fetchSanityDocument<SanityHomeDocument>(homePageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'Home'
      const fallbackDescription = document.intro?.trim() || 'Photography portfolio home page.'

      return {
        eyebrow: document.eyebrow?.trim() || 'Photography portfolio',
        headline: fallbackTitle,
        intro: fallbackDescription,
        featuredPhotos: mapAssetRefs(document.featuredPhotos),
        cta:
          document.cta && document.cta.label && document.cta.href
            ? {
                label: document.cta.label,
                href: document.cta.href,
              }
            : undefined,
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies HomePageContent
    },
    async getAboutPage() {
      if (isLocalArchiveMode()) {
        return fixtureAboutPage
      }

      const document = await fetchSanityDocument<SanityAboutDocument>(aboutPageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'About'
      const fallbackDescription = document.body?.[0]?.trim() || 'About page.'

      return {
        headline: fallbackTitle,
        body: (document.body ?? []).filter((value): value is string => typeof value === 'string'),
        photoHighlights: mapAssetRefs(document.photoHighlights),
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies AboutPageContent
    },
    async getContactPage() {
      if (isLocalArchiveMode()) {
        return fixtureContactPage
      }

      const document = await fetchSanityDocument<SanityContactDocument>(contactPageQuery)

      if (!document) {
        return null
      }

      const fallbackTitle = document.headline?.trim() || 'Contact'
      const fallbackDescription = document.body?.[0]?.trim() || 'Contact page.'

      return {
        headline: fallbackTitle,
        body: (document.body ?? []).filter((value): value is string => typeof value === 'string'),
        email: document.email?.trim(),
        socials:
          document.socials
            ?.filter((item): item is { label: string; href: string } =>
              Boolean(item.label && item.href)
            )
            .map((item) => ({
              label: item.label,
              href: item.href,
            })) ?? [],
        seo: normalizeSeo(document.seo, fallbackTitle, fallbackDescription),
      } satisfies ContactPageContent
    },
    async getCuratedPhotoRefs(pageId) {
      switch (pageId) {
        case 'homePage':
          return (await this.getHomePage())?.featuredPhotos ?? []
        case 'aboutPage':
          return (await this.getAboutPage())?.photoHighlights ?? []
        case 'contactPage':
          return []
      }
    },
    async listChangedDocuments(sinceIso) {
      if (isLocalArchiveMode()) {
        return ['siteSettings', 'homePage', 'aboutPage', 'contactPage']
      }

      const client = getSanityClient()

      if (!client) {
        return []
      }

      const rows = await client.fetch<Array<{ _type: PageDocumentId }>>(
        `*[_type in ["siteSettings", "homePage", "aboutPage", "contactPage"] && _updatedAt > $since]{
          _type
        }`,
        { since: sinceIso }
      )

      return Array.from(new Set(rows.map((row) => row._type)))
    },
    async verifyWebhook(request, bodyText) {
      const env = getServerEnv()
      const secret = env.SANITY_WEBHOOK_SECRET

      if (!secret) {
        return {
          ok: false,
          reason: 'Missing Sanity webhook secret.',
        }
      }

      const signature =
        request.headers.get(SIGNATURE_HEADER_NAME) ?? request.headers.get('x-sanity-signature')

      if (!signature) {
        return {
          ok: false,
          reason: 'Missing Sanity signature header.',
        }
      }

      const valid = await isValidSignature(bodyText, signature, secret)

      if (!valid) {
        return {
          ok: false,
          reason: 'Invalid Sanity webhook signature.',
        }
      }

      const payload = JSON.parse(bodyText) as Record<string, unknown>
      const documentType =
        payload._type ?? payload.documentType ?? payload.documentId ?? payload.type

      const documentId =
        documentType === 'siteSettings' ||
        documentType === 'homePage' ||
        documentType === 'aboutPage' ||
        documentType === 'contactPage'
          ? documentType
          : undefined

      if (!documentId) {
        logWarn('sanity.webhook.unknown-document', { payload })
      }

      return {
        ok: true,
        documentId,
        idempotencyKey:
          request.headers.get('idempotency-key') ??
          request.headers.get('Idempotency-Key') ??
          undefined,
        updatedAt:
          typeof payload._updatedAt === 'string' ? payload._updatedAt : new Date().toISOString(),
      }
    },
  }
}
