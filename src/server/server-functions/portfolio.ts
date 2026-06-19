import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseStatus } from '@tanstack/react-start/server'
import { z } from 'zod'

import { DEFAULT_GALLERY_LIMIT, MAX_GALLERY_LIMIT } from '@/lib/gallery-search'
import { getPageTags, getPhotoTags, getGalleryTags } from '@/server/cache/tags'
import { applyCacheResponse } from '@/server/cache/vercel'
import { ServiceUnavailableError, createPortfolioRepository } from '@/server/repository/portfolio'

const repository = createPortfolioRepository()

function getBaseUrlFromRequest() {
  const request = getRequest()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

function handleUnavailable(error: unknown) {
  if (error instanceof ServiceUnavailableError) {
    setResponseStatus(error.statusCode)
  }

  throw error
}

const galleryInputSchema = z.object({
  category: z.string().trim().min(1).optional(),
  series: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  after: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(MAX_GALLERY_LIMIT).default(DEFAULT_GALLERY_LIMIT),
})

export const getHomeViewServer = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const baseUrl = getBaseUrlFromRequest()
    const view = await repository.getHomeView({ baseUrl })
    applyCacheResponse('page', ['site', ...getPageTags('homePage')])
    return view
  } catch (error) {
    handleUnavailable(error)
  }
})

export const getAboutViewServer = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const baseUrl = getBaseUrlFromRequest()
    const view = await repository.getAboutView({ baseUrl })
    applyCacheResponse('page', ['site', ...getPageTags('aboutPage')])
    return view
  } catch (error) {
    handleUnavailable(error)
  }
})

export const getContactViewServer = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const baseUrl = getBaseUrlFromRequest()
    const view = await repository.getContactView({ baseUrl })
    applyCacheResponse('page', ['site', ...getPageTags('contactPage')])
    return view
  } catch (error) {
    handleUnavailable(error)
  }
})

export const getGalleryFeedServer = createServerFn({ method: 'GET' })
  .inputValidator(galleryInputSchema)
  .handler(async ({ data }) => {
    const baseUrl = getBaseUrlFromRequest()
    const feed = await repository.getGalleryFeed(data, { baseUrl })
    applyCacheResponse('gallery', getGalleryTags(data))
    return feed
  })

export const getPhotoDetailServer = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      slug: z.string().trim().min(1),
    })
  )
  .handler(async ({ data }) => {
    try {
      const baseUrl = getBaseUrlFromRequest()
      const detail = await repository.getPhotoDetail(data.slug, { baseUrl })

      if (!detail) {
        throw notFound()
      }

      applyCacheResponse('page', getPhotoTags(detail.photo))
      return detail
    } catch (error) {
      handleUnavailable(error)
    }
  })
