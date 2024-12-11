import { createClient } from 'contentful';
import type { Photo } from '../types/photo';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function getFeaturedPhotos(): Promise<Photo[]> {
  try {
    const response = await client.getEntries({
      content_type: 'photo',
      'fields.featured': true,
      order: '-fields.dateCreated',
      limit: 5,
    });

    return response.items.map(mapContentfulPhoto);
  } catch (error) {
    console.error('Error fetching featured photos:', error);
    return [];
  }
}

export async function getAllPhotos(): Promise<Photo[]> {
  try {
    const response = await client.getEntries({
      content_type: 'photo',
      order: '-fields.dateCreated',
      limit: 100,
    });

    return response.items.map(mapContentfulPhoto);
  } catch (error) {
    console.error('Error fetching all photos:', error);
    return [];
  }
}

export async function getPhotosByCategory(category: string): Promise<Photo[]> {
  try {
    const response = await client.getEntries({
      content_type: 'photo',
      'fields.category': category,
      order: '-fields.dateCreated',
    });

    return response.items.map(mapContentfulPhoto);
  } catch (error) {
    console.error(`Error fetching photos for category ${category}:`, error);
    return [];
  }
}

function mapContentfulPhoto(item: any): Photo {
  const fields = item.fields;
  return {
    id: item.sys.id,
    title: fields.title,
    description: fields.description,
    imageUrl: fields.imageUrl,
    category: fields.category,
    tags: fields.tags || [],
    metadata: fields.metadata,
    featured: fields.featured || false,
    dateCreated: fields.dateCreated,
  };
}