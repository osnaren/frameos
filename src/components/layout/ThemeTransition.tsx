import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useThemeContext } from './ThemeProvider';

interface ThemeTransitionProps {
  isAnimating: boolean;
  onAnimationComplete: () => void;
  origin: { x: number; y: number } | null;
}

export default function ThemeTransition({ isAnimating, onAnimationComplete, origin }: ThemeTransitionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const { theme } = useThemeContext();

  useEffect(() => {
    if (!isAnimating || !origin || !svgRef.current || !circleRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxRadius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

    gsap.set(circleRef.current, {
      attr: {
        cx: origin.x,
        cy: origin.y,
        r: 0,
      },
      opacity: 0,
    });

    const tl = gsap.timeline({
      onComplete: onAnimationComplete,
    });

    tl.to(circleRef.current, {
      opacity: 1,
      duration: 0.2,
    }).to(
      circleRef.current,
      {
        attr: { r: maxRadius },
        duration: 0.6,
        ease: 'power3.inOut',
      },
      '<'
    );

    return () => {
      tl.kill();
    };
  }, [isAnimating, origin, onAnimationComplete]);

  if (!isAnimating) return null;

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
      style={{ mixBlendMode: 'difference' }}
    >
      <circle ref={circleRef} fill={theme.mode === 'dark' ? '#ffffff' : '#000000'} r="0" />
    </svg>
  );
}
