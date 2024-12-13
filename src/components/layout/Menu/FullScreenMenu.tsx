import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMenuContext } from './MenuContext';
import { SocialLinks } from '../Footer/SocialLinks';

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
    y: '-10%',
    x: '10%',
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, y: 50 },
  open: { opacity: 1, y: 0 },
};

export default function FullScreenMenu() {
  const { isOpen, closeMenu } = useMenuContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-60 w-full h-screen flex items-center justify-center bg-[var(--color-background)] backdrop-blur-lg"
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
        >
          <nav className="flex flex-col items-center justify-center space-y-8">
            {navigation.map((item) => (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  to={item.href}
                  onClick={closeMenu}
                  className="text-4xl md:text-6xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            <motion.div variants={itemVariants} className="pt-12">
              <SocialLinks />
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
