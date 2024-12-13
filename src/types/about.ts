export interface AboutContent {
  heroTitle: string;
  journeyTitle: string;
  journeyContent: any; // Rich text content from Contentful
  approachTitle: string;
  approachContent: any; // Rich text content from Contentful
  images: AboutImage[];
}

export interface AboutImage {
  id: string;
  publicId: string; // Cloudinary public ID
  imageUrl?: string; // Optional URL if needed
  description: string;
}

export interface AboutResponse {
  items: {
    fields: AboutContent;
  }[];
}
