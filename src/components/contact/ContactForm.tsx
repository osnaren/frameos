import React from 'react';
import { useForm } from './useForm';
import FormInput from './FormInput';
import FormTextArea from './FormTextArea';
import { motion } from 'framer-motion';

export default function ContactForm() {
  const { formData, errors, loading, handleChange, handleSubmit } = useForm();

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormInput
        id="name"
        label="Name"
        type="text"
        value={formData.name}
        error={errors.name}
        onChange={handleChange}
        required
      />
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        error={errors.email}
        onChange={handleChange}
        required
      />
      <FormTextArea
        id="message"
        label="Message"
        value={formData.message}
        error={errors.message}
        onChange={handleChange}
        required
      />
      <motion.button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </motion.button>
    </motion.form>
  );
}
