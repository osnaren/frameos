import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMenuContext } from './MenuContext';
import { SocialLinks } from '../Footer/SocialLinks';
import gsap from 'gsap';
import { useRef, useEffect } from 'react';
import CurvedArrow from './CurvedArrow';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

const menuVariants = {
  closed: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, y: 50 },
  open: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50, transition: { duration: 0.3 } },
};

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

export default function FullScreenMenu() {
  const { isOpen, closeMenu } = useMenuContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-60 w-full h-screen flex items-center justify-center bg-surface backdrop-blur-lg"
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
        >
          <nav className="flex flex-col items-center justify-center space-y-8">
            {navigation.map((item) => {
              const { arrowRef, handleHover, handleLeave } = useArrowAnimation();
              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <Link
                    to={item.href}
                    onClick={closeMenu}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                    className="relative group items-center text-4xl md:text-6xl font-bold text-[var(--color-text)] hover-accent transition-colors"
                  >
                    <CurvedArrow
                      arrowRef={arrowRef}
                      width={100}
                      height={100}
                      className="
                      absolute top-0 -left-5 w-24 h-24 transform -translate-x-12 -translate-y-8 group-hover:text-accent transition-transform duration-300
                    "
                    />
                    {item.name}
                  </Link>
                </motion.div>
              );
            })}
            <motion.div variants={itemVariants} className="pt-12">
              <SocialLinks />
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
