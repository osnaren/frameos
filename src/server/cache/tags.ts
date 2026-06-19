import type { PageDocumentId } from '@/types/content'
import type { Photo, PhotoFilters } from '@/types/photo'

export function getPageTags(documentId: PageDocumentId) {
  switch (documentId) {
    case 'siteSettings':
      return ['site', 'page:home', 'page:about', 'page:contact']
    case 'homePage':
      return ['page:home']
    case 'aboutPage':
      return ['page:about']
    case 'contactPage':
      return ['page:contact']
  }
}

export function getGalleryTags(filters?: Pick<PhotoFilters, 'category' | 'series' | 'tag'>) {
  const tags = ['gallery']

  if (filters?.category) {
    tags.push(`gallery:category:${filters.category}`)
  }

  if (filters?.series) {
    tags.push(`gallery:series:${filters.series}`)
  }

  if (filters?.tag) {
    tags.push(`gallery:tag:${filters.tag}`)
  }

  return tags
}

export function getPhotoTags(
  photo: Pick<Photo, 'publicId' | 'slug' | 'category' | 'series' | 'tags'>
) {
  return [
    ...getGalleryTags({
      category: photo.category,
      series: photo.series,
    }),
    ...photo.tags.map((tag) => `gallery:tag:${tag}`),
    `photo:${photo.slug}`,
    `photo-id:${photo.publicId}`,
  ]
}
