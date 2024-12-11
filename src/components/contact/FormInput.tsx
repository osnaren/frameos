import React from 'react';
import { motion } from 'framer-motion';

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function FormInput({ id, label, type, value, error, onChange, required }: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full rounded-md shadow-sm ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-black focus:ring-black'
          }`}
        />
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600">
          {error}
        </motion.p>
      )}
    </div>
  );
}
