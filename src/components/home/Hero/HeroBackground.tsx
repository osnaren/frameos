import { forwardRef } from 'react';
import type { Photo } from '@ctypes/photo';

interface HeroBackgroundProps {
  photo: Photo;
}

const HeroBackground = forwardRef<HTMLDivElement, HeroBackgroundProps>(({ photo }, ref) => {
  const aspectRatio = photo.width / photo.height;
  const imageWidth = window.innerHeight * aspectRatio;

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{
        width: `${imageWidth}px`,
        height: '100%',
        backgroundImage: `url('${photo.imageUrl}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'left center',
        transform: 'translate3d(0,0,0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    />
  );
});

HeroBackground.displayName = 'HeroBackground';

export default HeroBackground;
