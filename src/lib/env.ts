const requiredEnvVars = [
  'VITE_CLOUDINARY_CLOUD_NAME',
  'VITE_CONTENTFUL_ACCESS_TOKEN',
  'VITE_CONTENTFUL_SPACE_ID',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_EMAILJS_TEMPLATE_ID',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Type-safe accessor
export const env = {
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  contentful: {
    spaceId: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
    accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
  },
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  },
};
