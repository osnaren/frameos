import type { AboutImage } from '@ctypes/about';
import type { CloudinaryImage } from '@ctypes/cloudinary';

export function transformCloudinaryImage(image: CloudinaryImage): AboutImage {
  return {
    id: image.public_id,
    publicId: image.public_id,
    imageUrl: image.secure_url,
    description: image.tags.join(', ') || 'No description available',
    metadata: {
      width: image.width,
      height: image.height,
      format: image.format,
      createdAt: new Date(image.created_at),
      size: image.bytes,
    },
  };
}

export function validateCloudinaryImage(image: unknown): image is CloudinaryImage {
  if (!image || typeof image !== 'object') return false;

  const requiredFields = ['public_id', 'secure_url', 'width', 'height', 'format', 'created_at'];

  return requiredFields.every(
    (field) => Object.prototype.hasOwnProperty.call(image, field) && image[field as keyof typeof image] !== null
  );
}
