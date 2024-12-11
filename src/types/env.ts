interface ImportMetaEnv {
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CONTENTFUL_ACCESS_TOKEN: string;
  VITE_CONTENTFUL_SPACE_ID: string;
}

export {};

declare global {
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}
