import emailjs from '@emailjs/browser';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface EmailData {
  name: string;
  email: string;
  message: string;
}

export function useEmailJS() {
  const [loading, setLoading] = useState(false);

  const sendEmail = async (data: EmailData) => {
    setLoading(true);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: data.name,
          from_email: data.email,
          message: data.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      toast.success('Message sent successfully!');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send message. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading };
}
