import gsap from 'gsap';
import { useEffect, useRef } from 'react';

export const useDrawAnimation = (isHovered: boolean) => {
  const cornerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<GSAPTimeline>();

  useEffect(() => {
    if (!cornerRef.current) return;

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const el = cornerRef.current;

    // Create new timeline
    timelineRef.current = gsap.timeline({
      defaults: { duration: 0.2, ease: 'power2.out' },
    });

    if (isHovered) {
      timelineRef.current.set(el, { opacity: 1 }).fromTo(el, { width: 0, height: 0 }, { width: '8px', height: '8px' });
    } else {
      timelineRef.current.to(el, { width: 0, height: 0 }).set(el, { opacity: 0 });
    }

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      gsap.set(el, { width: 0, height: 0, opacity: 0 });
    };
  }, [isHovered]);

  return cornerRef;
};
