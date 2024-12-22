import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="relative bg-[var(--color-surface)] py-16 px-6 text-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/path-to-your-workspace-image.jpg')" }}
      />

      {/* Content */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-[var(--color-primary)] z-10 relative"
      >
        Let’s Create Something Beautiful Together
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-lg text-[var(--color-text-secondary)] mt-4 max-w-2xl mx-auto z-10 relative"
      >
        From behind the lens to post-production magic, I bring stories to life. Curious about my work? Let’s dive in!
      </motion.p>

      {/* Buttons */}
      <div className="mt-8 z-10 relative space-x-4">
        <motion.a
          href="/contact"
          whileHover={{ scale: 1.05 }}
          className="inline-block px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[var(--color-secondary)] transition-all"
        >
          Get in Touch
        </motion.a>
        <motion.a
          href="/gears"
          whileHover={{ scale: 1.05 }}
          className="inline-block px-8 py-3 bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all"
        >
          Explore My Gear
        </motion.a>
      </div>
    </section>
  );
}
