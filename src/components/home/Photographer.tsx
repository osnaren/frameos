import { motion } from 'framer-motion';

export default function Photographer() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 text-4xl font-bold"
          >
            Hello, I&apos;m John Doe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 text-lg text-gray-600"
          >
            With over a decade of experience capturing life&apos;s most precious moments, I specialize in creating
            timeless photographs that tell your unique story. My passion lies in finding beauty in the ordinary and
            transforming fleeting moments into lasting memories.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4"
          >
            <a
              href="/gallery"
              className="inline-block rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
            >
              View Gallery
            </a>
            <a
              href="/contact"
              className="inline-block rounded-lg border border-black px-6 py-3 text-black transition-colors hover:bg-black hover:text-white"
            >
              Get in Touch
            </a>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <img src="/photographer-portrait.jpg" alt="John Doe - Photographer" className="rounded-lg shadow-2xl" />
          <div className="absolute -right-6 -bottom-6 rounded-lg bg-white p-6 shadow-xl">
            <p className="text-4xl font-bold text-black">10+</p>
            <p className="text-gray-600">Years of Experience</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
