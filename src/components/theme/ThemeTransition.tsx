import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import { useThemeContext } from './ThemeProvider';

interface ThemeTransitionProps {
  isAnimating: boolean;
  onAnimationComplete: () => void;
  origin: { x: number; y: number } | null;
}

export default function ThemeTransition({ isAnimating, onAnimationComplete, origin }: ThemeTransitionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const { theme, toggleTheme } = useThemeContext();

  useEffect(() => {
    if (!isAnimating || !origin || !svgRef.current || !circleRef.current) return;

    const circle = circleRef.current; // Copy circleRef.current to a variable
    const { scrollX } = window;
    const { scrollY } = window;
    const maxRadius =
      Math.max(
        Math.hypot(origin.x - scrollX, origin.y - scrollY),
        Math.hypot(origin.x - scrollX, origin.y - (window.innerHeight + scrollY)),
        Math.hypot(origin.x - (window.innerWidth + scrollX), origin.y - scrollY),
        Math.hypot(origin.x - (window.innerWidth + scrollX), origin.y - (window.innerHeight + scrollY))
      ) + 100;

    gsap.set(circle, {
      attr: { cx: origin.x, cy: origin.y, r: 0 },
      opacity: 0,
    });

    const tl = gsap.timeline({
      onComplete: onAnimationComplete,
    });

    tl.to(circle, {
      opacity: 1,
      duration: 0.2,
    })
      .to(circle, {
        attr: { r: maxRadius },
        duration: 0.4,
        ease: 'power2.inOut',
      })
      .to(circle, {
        attr: { r: 0 },
        duration: 0.3,
        ease: 'power2.in',
        onComplete: toggleTheme,
      });

    return () => {
      tl.kill();
      gsap.set(circle, { opacity: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, origin, onAnimationComplete]);

  if (!isAnimating) return null;

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[100]"
      style={{
        mixBlendMode: 'difference',
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <circle
        ref={circleRef}
        fill={theme.mode === 'dark' ? '#F8F9FA' : '#121212'}
        fillOpacity={0.8}
        style={{ willChange: 'transform' }}
        r="0"
      />
    </svg>
  );
}
