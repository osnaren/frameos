import { createClient } from 'contentful';
import type { AboutContent, AboutResponse } from '@ctypes/about';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const response = await client.getEntries<AboutContent>({
      content_type: 'about',
      limit: 1,
    });

    if (!response.items.length) {
      throw new Error('No about content found');
    }

    return response.items[0].fields;
  } catch (error) {
    console.error('Error fetching about content:', error);
    throw error;
  }
}
