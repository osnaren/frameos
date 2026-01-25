/// <reference types="vite/client" />

export {};

declare global {
  interface ImportMetaEnv extends Readonly<Record<string, string>> {
    readonly VITE_CLOUDINARY_CLOUD_NAME: string;
    readonly VITE_CONTENTFUL_ACCESS_TOKEN: string;
    readonly VITE_CONTENTFUL_SPACE_ID: string;
    readonly VITE_EMAILJS_SERVICE_ID: string;
    readonly VITE_EMAILJS_PUBLIC_KEY: string;
    readonly VITE_EMAILJS_TEMPLATE_ID: string;
  }
}
