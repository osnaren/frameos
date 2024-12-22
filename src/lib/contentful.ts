import { createClient } from 'contentful';

import type { Photo } from '../types/photo';
import { mapContentfulPhoto } from './transformers/contentful';

const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

export async function getPhotoByEntryId(id: string): Promise<Photo | null> {
  try {
    const response = await client.getEntry(id);
    return mapContentfulPhoto(response);
  } catch (error) {
    console.error(`Error fetching photo by id ${id}:`, error);
    return null;
  }
}

export async function getFeaturedPhotos(): Promise<Photo[]> {
  try {
    const response = await client.getEntries({
      content_type: 'photo',
      'fields.featured': true,
      order: ['-fields.dateCreated'],
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
      order: ['-fields.dateCreated'],
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
      order: ['-fields.dateCreated'],
    });

    return response.items.map(mapContentfulPhoto);
  } catch (error) {
    console.error(`Error fetching photos for category ${category}:`, error);
    return [];
  }
}
