import { General, GeneralContentType } from '@ctypes/general';
import { createClient, EntrySkeletonType } from 'contentful';

import { mapContentfulGeneral } from '../transformers/contentful';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

interface GetGeneralById extends EntrySkeletonType {
  <T extends GeneralContentType>(id: T): Promise<General<T> | null>;
}

export async function getGeneralById<T extends GeneralContentType>(id: T): Promise<General<T> | null> {
  try {
    const response = await client.getEntries<GetGeneralById>({
      content_type: 'general',
      'fields.id': id,
      limit: 1,
    });

    if (!response?.items?.[0]?.fields?.data) {
      console.error(`No data found for general content with id: ${id}`);
      return null;
    }

    return mapContentfulGeneral<T>(response.items[0]);
  } catch (error) {
    console.error(`Error fetching general content by id ${id}:`, error);
    return null;
  }
}
