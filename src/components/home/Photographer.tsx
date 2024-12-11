import React from 'react';
import { motion } from 'framer-motion';

export default function Photographer() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
    >
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-bold mb-6"
          >
            Hello, I'm John Doe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-600 mb-6"
          >
            With over a decade of experience capturing life's most precious moments, I specialize in creating timeless
            photographs that tell your unique story. My passion lies in finding beauty in the ordinary and transforming
            fleeting moments into lasting memories.
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
              className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View Gallery
            </a>
            <a
              href="/contact"
              className="inline-block border border-black text-black px-6 py-3 rounded-lg hover:bg-black hover:text-white transition-colors"
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
          <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-lg shadow-xl">
            <p className="text-4xl font-bold text-black">10+</p>
            <p className="text-gray-600">Years of Experience</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
