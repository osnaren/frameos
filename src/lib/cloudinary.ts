import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
});

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  const transformation = cld
    .image(publicId)
    .format(options.format || 'auto')
    .quality(options.quality || 'auto');

  if (options?.width) {
    transformation.resize({ width: options.width });
  }
  if (options?.height) {
    transformation.resize({ height: options.height });
  }

  return transformation.toURL();
}
