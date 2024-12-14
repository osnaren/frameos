import { Variants } from 'framer-motion';

export const iconAnimation: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  tap: { scale: 0.95 },
};
