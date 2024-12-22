import { motion } from 'framer-motion';

import { useMenuContext } from './MenuContext';

function Path(props: any) {
  return <motion.path fill="transparent" strokeWidth="2" stroke="currentColor" strokeLinecap="round" {...props} />;
}

export default function MenuButton() {
  const { isOpen, toggleMenu } = useMenuContext();

  return (
    <motion.button
      className="z-50 p-2 text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
      onClick={toggleMenu}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <svg width="23" height="23" viewBox="0 0 23 23">
        <Path
          variants={{
            closed: { d: 'M 2 2.5 L 20 2.5' },
            open: { d: 'M 3 16.5 L 17 2.5' },
          }}
          animate={isOpen ? 'open' : 'closed'}
        />
        <Path
          d="M 2 9.423 L 20 9.423"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 },
          }}
          animate={isOpen ? 'open' : 'closed'}
          transition={{ duration: 0.1 }}
        />
        <Path
          variants={{
            closed: { d: 'M 2 16.346 L 20 16.346' },
            open: { d: 'M 3 2.5 L 17 16.346' },
          }}
          animate={isOpen ? 'open' : 'closed'}
        />
      </svg>
    </motion.button>
  );
}
