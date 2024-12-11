import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ContactForm from '../components/contact/ContactForm';

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact | PhotoFolio</title>
        <meta name="description" content="Get in touch for photography services" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-xl rounded-lg overflow-hidden"
        >
          <div className="px-6 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h1>
              <p className="text-gray-600 mb-8">
                Have a project in mind? I'd love to hear from you. Send me a message and I'll respond as soon as
                possible.
              </p>
            </motion.div>
            <ContactForm />
          </div>
        </motion.div>
      </div>
    </>
  );
}
