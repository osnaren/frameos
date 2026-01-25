import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="relative bg-[var(--color-surface)] px-6 py-16 text-center">
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
        className="relative z-10 text-4xl font-bold text-[var(--color-primary)]"
      >
        Let’s Create Something Beautiful Together
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-secondary)]"
      >
        From behind the lens to post-production magic, I bring stories to life. Curious about my work? Let’s dive in!
      </motion.p>

      {/* Buttons */}
      <div className="relative z-10 mt-8 space-x-4">
        <motion.a
          href="/contact"
          whileHover={{ scale: 1.05 }}
          className="inline-block rounded-lg bg-[var(--color-primary)] px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-[var(--color-secondary)]"
        >
          Get in Touch
        </motion.a>
        <motion.a
          href="/gears"
          whileHover={{ scale: 1.05 }}
          className="inline-block rounded-lg border border-[var(--color-primary)] bg-transparent px-8 py-3 font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white"
        >
          Explore My Gear
        </motion.a>
      </div>
    </section>
  );
}
