import { Document } from '@contentful/rich-text-types';

export interface AboutContent {
  heroTitle: string;
  journeyTitle: string;
  journeyContent: Document;
  approachTitle: string;
  approachContent: Document;
  images: AboutImage[];
}

export interface AboutImage {
  id: string;
  publicId: string;
  imageUrl: string;
  description: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    createdAt: Date;
    size: number;
  };
}
