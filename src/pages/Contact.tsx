import { motion } from 'framer-motion';

import ContactForm from '../components/contact/ContactForm';

export default function Contact() {
  return (
    <>
      <title>Contact | PhotoFolio</title>
      <meta name="description" content="Get in touch for photography services" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-lg bg-white shadow-xl"
        >
          <div className="px-6 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Get in Touch</h1>
              <p className="mb-8 text-gray-600">
                Have a project in mind? I&apos;d love to hear from you. Send me a message and I&apos;ll respond as soon
                as possible.
              </p>
            </motion.div>
            <ContactForm />
          </div>
        </motion.div>
      </div>
    </>
  );
}
