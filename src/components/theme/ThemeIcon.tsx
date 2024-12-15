import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ThemeIconProps {
  isDark: boolean;
  className?: string;
  isAnimating: boolean;
}

export default function ThemeIcon({ isDark, className = 'w-6 h-6', isAnimating }: ThemeIconProps) {
  const moonRef = useRef<SVGGElement>(null);
  const sunCenterRef = useRef<SVGCircleElement>(null);
  const sunRaysRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!isAnimating || !moonRef.current || !sunCenterRef.current || !sunRaysRef.current) return;

    const duration = 0.8; // Increased duration to match overall transition
    const ease = 'power2.inOut';

    if (isDark) {
      gsap
        .timeline()
        .to(moonRef.current, {
          opacity: 0,
          scale: 0.5,
          duration: duration * 0.5,
          ease,
        })
        .to(
          sunCenterRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: duration * 0.5,
            ease,
          },
          '>-0.3'
        )
        .to(
          sunRaysRef.current,
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: duration * 0.5,
            ease,
          },
          '<'
        );
    } else {
      // Animate to moon
      gsap
        .timeline()
        .to(sunRaysRef.current, {
          opacity: 0,
          scale: 0.5,
          rotate: 45,
          duration,
          ease,
        })
        .to(
          sunCenterRef.current,
          {
            opacity: 0,
            scale: 0.5,
            duration,
            ease,
          },
          '<'
        )
        .to(
          moonRef.current,
          {
            opacity: 1,
            scale: 1,
            duration,
            ease,
          },
          '<'
        );
    }
  }, [isDark, isAnimating]);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      stroke="currentColor"
    >
      {/* Moon */}
      <g
        ref={moonRef}
        style={{
          transformOrigin: 'center',
          opacity: isDark ? 0 : 1,
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </g>

      {/* Sun Center */}
      <circle
        ref={sunCenterRef}
        cx="12"
        cy="12"
        r="5"
        style={{
          transformOrigin: 'center',
          opacity: isDark ? 1 : 0,
        }}
      />

      {/* Sun Rays */}
      <g
        ref={sunRaysRef}
        style={{
          transformOrigin: 'center',
          opacity: isDark ? 1 : 0,
        }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="12"
            y1="4"
            x2="12"
            y2="2"
            style={{
              transformOrigin: 'center',
              transform: `rotate(${angle}deg) translate(0, 0)`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
