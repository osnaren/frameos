import { motion, AnimatePresence } from 'framer-motion';
import { useMenuContext } from './MenuContext';
import { SocialLinks } from '../Footer/SocialLinks';
import NavigationItem from './NavigationItem';

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
            {navigation.map((item) => (
              <NavigationItem key={item.name} item={item} onClick={closeMenu} itemVariants={itemVariants} />
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
