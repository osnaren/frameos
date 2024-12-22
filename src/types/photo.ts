export type PhotoCategory = 'portraits' | 'landscapes' | 'candid' | 'street' | 'nature' | 'architecture';

export interface PhotoMetadata {
  iso: number;
  shutterSpeed: string;
  aperture: string;
  location: string;
  camera: string;
  lens: string;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  publicId: string;
  category: PhotoCategory;
  tags: string[];
  metadata: PhotoMetadata;
  featured: boolean;
  dateCreated: string;
  height: number;
  width: number;
}
