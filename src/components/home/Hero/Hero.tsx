import { usePhotoById } from '@hooks/usePhotos';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

import HeroBackground from './HeroBackground';
import HeroText from './HeroText';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const { photo } = usePhotoById('7iwOkCZd9YEcuuT78gG1Ep');
  const panoRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photo) return;

    const panoElement = panoRef.current;
    const scrollElement = scrollRef.current;
    const containerElement = containerRef.current;

    if (!panoElement || !scrollElement || !containerElement) return;

    // Calculate dimensions based on viewport and image ratio
    const aspectRatio = photo.width / photo.height;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Calculate the actual image dimensions when contained in viewport
    const imageHeight = viewportHeight;
    const imageWidth = imageHeight * aspectRatio;

    // Calculate total scroll distance needed
    const totalWidth = Math.max(imageWidth - viewportWidth, 0);

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: scrollElement,
        start: 'top top',
        end: () => `+=${totalWidth}`,
        pin: containerElement,
        anticipatePin: 1,
        scrub: 0.8,
        pinSpacing: true,
        preventOverlaps: true,
        fastScrollEnd: true,
        onUpdate: (self) => {
          // Smoother transitions for both directions
          const { progress } = self;
          const threshold = 0.85;
          const fadeRange = 0.15;

          if (progress > threshold) {
            const fadeProgress = (progress - threshold) / fadeRange;
            const opacity = gsap.utils.clamp(0, 1, 1 - fadeProgress);
            gsap.to(containerElement, {
              opacity,
              duration: 0.2,
              overwrite: true,
            });
          } else {
            gsap.to(containerElement, {
              opacity: 1,
              duration: 0.2,
              overwrite: true,
            });
          }
        },
        onLeaveBack: () => {
          gsap.to(containerElement, {
            opacity: 1,
            duration: 0.3,
          });
        },
        onEnterBack: () => {
          ScrollTrigger.refresh();
        },
      },
    });

    timeline.to(panoElement, {
      x: -totalWidth,
      ease: 'none',
      onComplete: () => {
        scrollElement.style.pointerEvents = 'none';
      },
      onReverseComplete: () => {
        scrollElement.style.pointerEvents = 'auto';
      },
    });

    // Add resize handler
    const handleResize = () => {
      ScrollTrigger.refresh(true);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timeline.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [photo]);

  // if (!photo) return null;

  return (
    <>
      {/* Scroll container */}
      <div ref={scrollRef} className="relative">
        {/* Pin container */}
        <div ref={containerRef} className="h-screen w-full overflow-hidden">
          {/* Content container */}
          <div className="relative h-full w-full">
            {photo && <HeroBackground ref={panoRef} photo={photo} />}
            <HeroText />
          </div>
        </div>
      </div>
    </>
  );
}
