import { Document } from '@contentful/rich-text-types';

import { CloudinaryImage } from './cloudinary';

export interface ContentfulResponse<T> {
  sys: {
    type: string;
  };
  total: number;
  skip: number;
  limit: number;
  items: ContentfulEntry<T>[];
}

export interface ContentfulEntry<T> {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    locale: string;
    contentType: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
  };
  fields: T;
  metadata: {
    tags: any[];
  };
}

export interface AboutFields {
  heroTitle: string;
  journeyTitle: string;
  journeyContent: Document;
  approachTitle: string;
  approachContent: Document;
  images: CloudinaryImage[];
}
