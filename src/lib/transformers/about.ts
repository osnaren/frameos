import type { AboutContent } from '@ctypes/about';
import type { AboutFields, ContentfulResponse } from '@ctypes/contentful';

import { transformCloudinaryImage, validateCloudinaryImage } from './cloudinary';

export function transformAboutContent(response: ContentfulResponse<AboutFields>): AboutContent {
  if (!response.items.length) {
    throw new Error('No about content found');
  }

  const { fields } = response.items[0];

  return {
    heroTitle: fields.heroTitle,
    journeyTitle: fields.journeyTitle,
    journeyContent: fields.journeyContent,
    approachTitle: fields.approachTitle,
    approachContent: fields.approachContent,
    images: fields.images.filter(validateCloudinaryImage).map(transformCloudinaryImage),
  };
}
