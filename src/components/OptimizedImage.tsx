import React from 'react';
import { AdvancedImage, lazyload, responsive } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { useThemeContext } from './theme/ThemeProvider';

interface OptimizedImageProps {
  publicId: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
});

export default function OptimizedImage({ publicId, alt, className, priority = false }: OptimizedImageProps) {
  const { setDynamicTheme } = useThemeContext();
  const loading = priority ? 'eager' : 'lazy';

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src) {
      // Extract dominant color and set dynamic theme
      // This would typically be done through a color extraction service
      // For now, we'll use a placeholder implementation
      // setDynamicTheme('#121212');
    }
  };

  const myImage = cld.image(publicId);

  return (
    <AdvancedImage
      cldImg={myImage}
      plugins={[lazyload(), responsive()]}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      loading={loading}
    />
  );
}
