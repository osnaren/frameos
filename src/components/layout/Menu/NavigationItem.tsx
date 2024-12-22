import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import CurvedArrow from './CurvedArrow';

const useArrowAnimation = () => {
  const arrowRef = useRef<SVGPathElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (arrowRef.current) {
      const length = arrowRef.current.getTotalLength();
      gsap.set(arrowRef.current, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  const handleHover = () => {
    if (arrowRef.current) {
      // Kill any existing animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create new timeline
      timelineRef.current = gsap.timeline().to(arrowRef.current, {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  };

  const handleLeave = () => {
    if (arrowRef.current) {
      // Kill any existing animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create new timeline
      timelineRef.current = gsap.timeline().to(arrowRef.current, {
        strokeDashoffset: arrowRef.current.getTotalLength(),
        duration: 0.4,
        ease: 'power2.in',
      });
    }
  };

  return { arrowRef, handleHover, handleLeave };
};

interface NavigationItemProps {
  item: { name: string; href: string };
  onClick: () => void;
  itemVariants: Record<string, any>;
}

function NavigationItem({ item, onClick, itemVariants }: NavigationItemProps) {
  const { arrowRef, handleHover, handleLeave } = useArrowAnimation();

  return (
    <motion.div variants={itemVariants}>
      <Link
        to={item.href}
        onClick={onClick}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        className="relative group items-center text-4xl md:text-6xl font-bold text-[var(--color-text)] hover-accent transition-colors"
      >
        <CurvedArrow
          arrowRef={arrowRef}
          width={100}
          height={100}
          className="absolute top-0 -left-5 w-24 h-24 transform -translate-x-12 -translate-y-8 group-hover:text-accent transition-transform duration-300"
        />
        {item.name}
      </Link>
    </motion.div>
  );
}

export default NavigationItem;
