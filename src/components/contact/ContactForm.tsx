import { motion } from 'framer-motion';

import FormInput from './FormInput';
import FormTextArea from './FormTextArea';
import { useForm } from './useForm';

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
        className="w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-[var(--color-surface)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </motion.button>
    </motion.form>
  );
}
