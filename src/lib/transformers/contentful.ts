import type { Photo } from '@ctypes/photo';
import { Entry, EntrySkeletonType } from 'contentful';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapContentfulPhoto(item: any): Photo {
  const { fields } = item;
  return {
    id: item.sys.id,
    title: fields.title,
    description: fields.description,
    imageUrl: fields.cloudinary[0].original_url,
    publicId: fields.cloudinary[0].public_id,
    category: fields.category,
    tags: fields.tags || [],
    metadata: fields.metadata,
    featured: fields.featured || false,
    dateCreated: fields.dateCreated,
    height: fields.cloudinary[0].height,
    width: fields.cloudinary[0].width,
  };
}

export function mapContentfulGeneral(item: Entry<EntrySkeletonType, undefined, string>): General {
  const { fields } = item;
  return {
    id: fields.id,
    data: fields.data,
  };
}
