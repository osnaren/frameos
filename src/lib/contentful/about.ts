import { createClient } from 'contentful';
import type { AboutContent } from '@ctypes/about';
import type { ContentfulResponse, AboutFields } from '@ctypes/contentful';
import { transformAboutContent } from '../transformers/about';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const response = await client.getEntries<AboutFields>({
      content_type: 'about',
      limit: 1,
    });

    if (!response.items.length) {
      throw new Error('No about content found');
    }

    return transformAboutContent(response);
  } catch (error) {
    console.error('Error fetching about content:', error);
    throw error;
  }
}
