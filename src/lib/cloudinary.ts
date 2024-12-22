import { Cloudinary } from '@cloudinary/url-gen';
import { Resize } from '@cloudinary/url-gen/actions/resize';

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
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const transformation = cld.image(publicId);

  // Apply resizing transformations if width or height is provided
  if (options.width && options.height) {
    transformation.resize(Resize.scale().width(options.width).height(options.height));
  } else if (options.width) {
    transformation.resize(Resize.scale().width(options.width));
  } else if (options.height) {
    transformation.resize(Resize.scale().height(options.height));
  }

  // Apply format and quality transformations
  transformation.format(options.format || 'auto').quality(options.quality || 'auto');

  // Generate and return the optimized URL
  return transformation.toURL();
}
