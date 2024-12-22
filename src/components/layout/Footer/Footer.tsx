import './style.scss';

import { usePhotoById } from '@hooks/usePhotos';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

import { SocialLinks } from './SocialLinks';

export default function Footer() {
  const { photo } = usePhotoById('46u1YJ2t4XJynzhLAtbcIV');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const text = textRef.current;
    if (!wrapper || !text) return;

    const handleMouseEnter = () => {
      gsap
        .timeline()
        // First show lines from sides
        .set(wrapper, {
          '--line-position': '20px',
        })
        .to(wrapper, {
          '--line-scale': 1,
          '--line-opacity': 1,
          duration: 0.2,
          ease: 'power2.out',
        })
        // Move lines inward
        .to(wrapper, {
          '--line-position': '5px',
          duration: 0.3,
          ease: 'power2.inOut',
        })
        // Hide text while lines are close
        .to(
          text,
          {
            opacity: 0,
            scale: 0.95,
            duration: 0.2,
            ease: 'power2.in',
          },
          '<'
        )
        // Short pause at closest point
        .to({}, { duration: 0.1 })
        // Move lines back out while fading text back in
        .to(wrapper, {
          '--line-position': '20px',
          duration: 0.3,
          ease: 'power2.out',
        })
        .to(
          text,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          },
          '<'
        )
        // Fade out lines
        .to(wrapper, {
          '--line-scale': 0,
          '--line-opacity': 0,
          duration: 0.2,
          ease: 'power2.inOut',
        });
    };

    wrapper.addEventListener('mouseenter', handleMouseEnter);
    return () => wrapper.removeEventListener('mouseenter', handleMouseEnter);
  }, []);

  return (
    <footer className="relative bg-[var(--color-background)]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={photo?.imageUrl} alt="" className="footer-image w-1/2 h-full object-cover float-right" />
        <div className="top-fade" />
        <div className="left-fade" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Tagline */}
          <div ref={wrapperRef} className="tagline-wrapper cursor-default">
            <p ref={textRef} className="text-xl font-medium text-[var(--color-text)]">
              Capturing moments | One frame at a time
            </p>
          </div>

          {/* Social Links */}
          <SocialLinks />

          {/* Copyright and Credits */}
          <div className="flex flex-col items-center space-y-2 text-sm text-[var(--color-text)]/80 cursor-default">
            <p>&copy; 2024 OSLabs. </p>
            <p>
              Made with ❤️ in <span className="waving-flag">🇮🇳</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
