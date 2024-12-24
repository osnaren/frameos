import type { AboutContent } from '@ctypes/about';
import type { AboutFields } from '@ctypes/contentful';
import { createClient, EntrySkeletonType } from 'contentful';

import { transformAboutContent } from '../transformers/about';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

interface AboutSectionFields extends EntrySkeletonType, AboutFields {
  fields: {
    title: string;
    description: string;
  };
  contentTypeId: string;
}

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const response = await client.getEntries<AboutSectionFields>({
      content_type: 'about',
      limit: 1,
    });

    if (!response.items.length) {
      throw new Error('No about content found');
    }

    return transformAboutContent(response as any);
  } catch (error) {
    console.error('Error fetching about content:', error);
    throw error;
  }
}
