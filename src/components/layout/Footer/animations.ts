import { Variants } from 'framer-motion';

export const iconAnimation: Variants = {
  initial: { scale: 1 },
  hover: { scale: 0.9 },
  tap: { scale: 0.8 },
};

export const cornerAnimation: Variants = {
  initial: { scale: 0, opacity: 0 },
  hover: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2 },
  },
};
