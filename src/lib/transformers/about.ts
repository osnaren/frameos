import type { AboutContent } from '@/types/about';
import type { AboutFields } from '@/types/contentful';
import type { EntryCollection, EntrySkeletonType } from 'contentful';

import { transformCloudinaryImage, validateCloudinaryImage } from './cloudinary';

export function transformAboutContent(response: EntryCollection<EntrySkeletonType & AboutFields>): AboutContent {
  if (!response.items.length) {
    throw new Error('No about content found');
  }

  const safeFields = response.items[0].fields as unknown as AboutFields;

  return {
    heroTitle: safeFields.heroTitle ?? '',
    journeyTitle: safeFields.journeyTitle ?? '',
    journeyContent: safeFields.journeyContent ?? { nodeType: 'document', data: {}, content: [] },
    approachTitle: safeFields.approachTitle ?? '',
    approachContent: safeFields.approachContent ?? { nodeType: 'document', data: {}, content: [] },
    images: (safeFields.images ?? []).filter(validateCloudinaryImage).map(transformCloudinaryImage),
  };
}
