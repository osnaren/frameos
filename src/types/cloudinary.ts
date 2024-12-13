import { Asset } from 'contentful';

export interface CloudinaryImage {
  url: string;
  secure_url: string;
  public_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  tags: string[];
  type: string;
  resource_type: string;
  original_url: string;
  original_secure_url: string;
  raw_transformation: string;
}

export interface CloudinaryAsset extends Asset {
  fields: {
    file: {
      url: string;
      details: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
      fileName: string;
      contentType: string;
    };
  };
}
