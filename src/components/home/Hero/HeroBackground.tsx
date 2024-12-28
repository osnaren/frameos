import type { Photo } from '@ctypes/photo';
import { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface HeroBackgroundProps {
  photo: Photo;
}

const StyledHeroBackground = styled.div<{ imageUrl: string; imageWidth: number }>`
  ${({ imageUrl, imageWidth }) => css`
    position: absolute;
    inset: 0;
    height: 100%;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: left center;
    transform: translate3d(0, 0, 0);
    will-change: transform;
    backface-visibility: hidden;
    background-image: url(${imageUrl});
    width: ${imageWidth}px;
  `}
`;

const HeroBackground = forwardRef<HTMLDivElement, HeroBackgroundProps>(({ photo }, ref) => {
  const aspectRatio = photo.width / photo.height;
  const imageWidth = window.innerHeight * aspectRatio;

  return <StyledHeroBackground ref={ref} imageUrl={photo.imageUrl} imageWidth={imageWidth} />;
});

HeroBackground.displayName = 'HeroBackground';

export default HeroBackground;
