import { Document } from '@contentful/rich-text-types';

import { CloudinaryImage } from './cloudinary';
import { GeneralContentType, GeneralDataType } from './general';

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

export interface ContentfulGeneralFields<T extends GeneralContentType> {
  id: T;
  data: GeneralDataType[T];
}

export type ContentfulGeneralEntry<T extends GeneralContentType> = ContentfulEntry<ContentfulGeneralFields<T>>;
